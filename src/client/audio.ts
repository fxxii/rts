export const audioBuses = ['master', 'effects', 'voice', 'alerts', 'ambience', 'music'] as const;
export type AudioBus = typeof audioBuses[number];
type Event = { variants: string[]; bus: string; spatial: boolean; gain: number; cooldown_seconds?: number; max_concurrent: number; random_pitch_range?: [number, number] };
type Asset = { id: string; wav: string; ogg: string; loop: boolean };
type Manifest = { events: Record<string, Event>; assets: Asset[] };
type Playing = { name: string; bus: AudioBus; priority: number; source: AudioBufferSourceNode; gain: GainNode; panner?: PannerNode };
const storageKey = 'ironvale.audio.volumes';

/** Presentation only: callers must pass permitted-view events and one voice event per group order. */
export class AudioEngine {
  private context?: AudioContext;
  private manifest?: Manifest;
  private buses = new Map<AudioBus, GainNode>();
  private buffers = new Map<string, Promise<AudioBuffer>>();
  private active = new Set<Playing>();
  private pending = new Map<string, number>();
  private last = new Map<string, number>();
  private abort = new AbortController();
  private initialization?: Promise<void>;
  private generation = 0;
  private battle = false;
  private epoch = 0;
  private listener = { x: 0, z: 0 };
  private started: Record<string, number> = {};
  private fallbacks = 0;
  private errors: string[] = [];
  private volumes: Record<AudioBus, number> = { master: .8, effects: .8, voice: .8, alerts: .9, ambience: .35, music: .35 };
  constructor(private onError: (message: string) => void = () => {}) {
    try {
      const stored = JSON.parse(localStorage.getItem(storageKey) ?? '{}') as Record<string, unknown>;
      for (const bus of audioBuses) if (typeof stored[bus] === 'number' && Number.isFinite(stored[bus])) this.volumes[bus] = Math.max(0, Math.min(1, stored[bus]));
    } catch { /* Storage can be unavailable in privacy mode. */ }
  }
  async start(): Promise<void> {
    if (!this.context) {
      this.abort = new AbortController();
      this.context = new AudioContext();
      for (const bus of audioBuses) this.buses.set(bus, this.context.createGain());
      this.buses.get('master')!.connect(this.context.destination);
      for (const bus of audioBuses) {
        this.buses.get(bus)!.gain.value = this.volumes[bus];
        if (bus !== 'master') this.buses.get(bus)!.connect(this.buses.get('master')!);
      }
      this.epoch = this.context.currentTime;
      this.setListener(this.listener.x, this.listener.z);
    }
    // Invoke resume synchronously in the user's activation before fetching or awaiting.
    const resumed = this.context.resume();
    const generation = this.generation;
    this.initialization ??= (async () => {
      const response = await fetch('/audio/manifest.json', { signal: this.abort.signal });
      if (!response.ok) throw new Error(`Manifest HTTP ${response.status}`);
      const manifest = await response.json() as Manifest;
      if (generation !== this.generation) return;
      this.manifest = manifest;
    })();
    try { await Promise.all([resumed, this.initialization]); }
    catch (error) { this.initialization = undefined; if (generation === this.generation) this.report(error); }
  }
  getEventNames(): string[] { return Object.keys(this.manifest?.events ?? {}); }
  play(name: string, position?: { x: number; z: number }): void {
    const context = this.context;
    const event = this.manifest?.events[name];
    if (!context || context.state !== 'running' || !event) return;
    const now = context.currentTime;
    if (now - (this.last.get(name) ?? -Infinity) < (event.cooldown_seconds ?? 0)) return;
    if ([...this.active].filter(item => item.name === name).length + (this.pending.get(name) ?? 0) >= event.max_concurrent) return;
    if ([...this.pending.values()].reduce((a, b) => a + b, 0) >= 32 && !['voice', 'alerts', 'music'].includes(event.bus)) return;
    this.last.set(name, now);
    this.pending.set(name, (this.pending.get(name) ?? 0) + 1);
    const generation = this.generation;
    const id = event.variants[Math.floor(Math.random() * event.variants.length)];
    const asset = this.manifest!.assets.find(item => item.id === id)!;
    void this.decode(asset).then(buffer => {
      if (generation !== this.generation || context.state !== 'running') return;
      const bus: AudioBus = event.bus === 'world' || event.bus === 'ui' ? 'effects' : event.bus as AudioBus;
      const distance = position ? Math.hypot(position.x - this.listener.x, position.z - this.listener.z) : 0;
      const priority = (bus === 'alerts' ? 1000 : bus === 'voice' ? 900 : bus === 'music' ? 800 : bus === 'ambience' ? 100 : 400) - Math.min(99, distance);
      if (this.active.size >= 32) {
        const victim = [...this.active].sort((a, b) => a.priority - b.priority)[0];
        if (victim.priority >= priority) return;
        this.stop(victim);
      }
      const source = context.createBufferSource();
      const gain = context.createGain();
      source.buffer = buffer;
      source.loop = asset.loop;
      const pitch = event.random_pitch_range ?? [1, 1];
      source.playbackRate.value = asset.loop ? 1 : pitch[0] + Math.random() * (pitch[1] - pitch[0]);
      gain.gain.value = bus === 'music' ? 0 : event.gain;
      source.connect(gain);
      const item: Playing = { name, bus, priority, source, gain };
      if (event.spatial && position) {
        const panner = context.createPanner();
        panner.panningModel = 'equalpower'; panner.distanceModel = 'inverse'; panner.refDistance = 8; panner.maxDistance = 150;
        panner.positionX.value = position.x; panner.positionZ.value = position.z;
        gain.connect(panner); panner.connect(this.buses.get(bus)!); item.panner = panner;
      } else gain.connect(this.buses.get(bus)!);
      this.active.add(item);
      source.onended = () => this.release(item);
      source.start(0, asset.loop ? (context.currentTime - this.epoch) % buffer.duration : 0);
      this.started[name] = (this.started[name] ?? 0) + 1;
      this.mixMusic();
    }).catch(error => { if (generation === this.generation) this.report(error); }).finally(() => {
      if (generation === this.generation) this.pending.set(name, Math.max(0, (this.pending.get(name) ?? 1) - 1));
    });
  }
  private decode(asset: Asset): Promise<AudioBuffer> {
    const cached = this.buffers.get(asset.id);
    if (cached) return cached;
    const context = this.context!;
    const signal = this.abort.signal;
    const promise = (async () => {
      for (const format of ['ogg', 'wav'] as const) {
        try {
          const response = await fetch(`/audio/${asset[format]}`, { signal });
          if (!response.ok) throw new Error(`${asset[format]} HTTP ${response.status}`);
          return await context.decodeAudioData(await response.arrayBuffer());
        } catch (error) {
          if (signal.aborted || format === 'wav') throw error;
          this.fallbacks++;
        }
      }
      throw new Error(`Cannot decode ${asset.id}`);
    })();
    this.buffers.set(asset.id, promise);
    void promise.catch(() => { if (this.buffers.get(asset.id) === promise) this.buffers.delete(asset.id); });
    return promise;
  }
  setListener(x: number, z: number): void {
    if (!Number.isFinite(x) || !Number.isFinite(z)) return;
    this.listener = { x, z };
    if (!this.context) return;
    const listener = this.context.listener;
    listener.positionX.value = x; listener.positionY.value = 0; listener.positionZ.value = z;
    listener.forwardX.value = 0; listener.forwardY.value = 0; listener.forwardZ.value = -1;
    listener.upX.value = 0; listener.upY.value = 1; listener.upZ.value = 0;
  }
  setVolume(bus: AudioBus, value: number): void {
    if (!Number.isFinite(value) || !audioBuses.includes(bus)) return;
    this.volumes[bus] = Math.min(1, Math.max(0, value));
    const node = this.buses.get(bus);
    if (node && this.context) node.gain.setTargetAtTime(this.volumes[bus], this.context.currentTime, .02);
    try { localStorage.setItem(storageKey, JSON.stringify(this.volumes)); } catch { /* Keep session controls working. */ }
  }
  getVolumes(): Record<AudioBus, number> { return { ...this.volumes }; }
  setBattle(active: boolean): void {
    this.battle = active;
    // Both loops share the audio clock epoch, including when decoded at different times.
    this.play('music.explore'); this.play('music.battle'); this.mixMusic();
  }
  private mixMusic(): void {
    if (!this.context) return;
    const duck = [...this.active].some(item => item.bus === 'voice' || item.bus === 'alerts') ? .3 : 1;
    for (const item of this.active) if (item.bus === 'music') {
      const selected = item.name === (this.battle ? 'music.battle' : 'music.explore');
      item.gain.gain.setTargetAtTime(selected ? (this.manifest!.events[item.name].gain * duck) : 0, this.context.currentTime, .25);
    }
  }
  private release(item: Playing): void {
    this.active.delete(item); item.source.onended = null; item.source.disconnect(); item.gain.disconnect(); item.panner?.disconnect(); this.mixMusic();
  }
  private stop(item: Playing): void { item.source.stop(); this.release(item); }
  dispose(): void {
    this.generation++; this.abort.abort();
    for (const item of [...this.active]) this.stop(item);
    for (const bus of this.buses.values()) bus.disconnect();
    if (this.context) void this.context.close().catch(() => {});
    this.context = undefined; this.manifest = undefined; this.initialization = undefined;
    this.buses.clear(); this.buffers.clear(); this.pending.clear(); this.last.clear();
  }
  private report(error: unknown): void {
    const message = `Audio unavailable: ${error instanceof Error ? error.message : String(error)}`;
    this.errors.push(message); if (this.errors.length > 20) this.errors.shift(); this.onError(message);
  }
  getDiagnostics() {
    return { state: this.context?.state ?? 'closed', activeSources: this.active.size, pendingSources: [...this.pending.values()].reduce((a, b) => a + b, 0), decodedAssets: this.buffers.size, started: { ...this.started }, fallbacks: this.fallbacks, errors: [...this.errors], music: [...this.active].filter(item => item.bus === 'music').map(item => ({ name: item.name, gain: item.gain.gain.value })) };
  }
}
