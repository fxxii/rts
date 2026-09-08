import './style.css';
import { GameRenderer } from './renderer.js';
import { AudioEngine, audioBuses } from './audio.js';
import { Hud, type Intent } from './hud.js';
import type { Command, PlayerView } from '../protocol/types.js';
const app = document.querySelector<HTMLDivElement>('#app')!;
app.innerHTML = `
  <canvas id="battlefield" aria-label="Ironvale battlefield"></canvas>
  <header id="topbar"><a class="wordmark">IRONVALE<span>REALMS IN CONFLICT</span></a><div class="resources"><div><i>◈</i><strong id="food">—</strong><small>FOOD</small></div><div><i>♧</i><strong id="wood">—</strong><small>WOOD</small></div><div><i>◆</i><strong id="gold">—</strong><small>GOLD</small></div><div><i>⬟</i><strong id="stone">—</strong><small>STONE</small></div><div><i>⚑</i><strong id="population">—</strong><small>POPULATION</small></div></div><div class="age"><strong id="age">Dark Age</strong><span id="clock">00:00</span></div><button id="settings-open" class="icon-button" aria-label="Settings and controls">☷</button></header>
  <div id="match-label"><span class="dot"></span><span id="connection">Not connected</span><span class="badge">DEVELOPMENT SLICE</span></div>
  <div id="toast" role="status" aria-live="polite"></div><div id="intent"></div><div id="drag-box"></div>
  <div id="quick-actions"><button id="reconnect-game" hidden>Reconnect</button><button id="town">♜ Town Center <kbd>H</kbd></button><button id="idle">◇ Idle workers</button></div>
  <footer id="hud"><section class="minimap-wrap"><div class="map-label">THE BORDERLANDS <span>64 × 64</span></div><canvas id="minimap" width="192" height="192" aria-label="Minimap"></canvas></section><section class="selection"><div class="selection-heading"><div id="portrait">♜</div><div><span class="eyebrow">YOUR COMMAND</span><h2 id="selection-title">Your settlement awaits</h2><p id="selection-detail">Select a worker to begin.</p></div></div><div id="queue"></div><div class="selection-foot">SHIFT to queue orders <span>·</span> RIGHT CLICK to interact</div></section><section class="action-panel"><div class="panel-label">ORDERS & ECONOMY</div><div id="commands"></div></section></footer>
  <main id="lobby"><div class="lobby-backdrop"></div><div class="lobby-content"><div class="eyebrow">A REALM WORTH FIGHTING FOR</div><h1>IRONVALE</h1><p class="lead">Raise a settlement.<br>Command its future.</p><p class="description">A medieval strategy game of patient economies,<br>bold expeditions, and battles that decide a kingdom.</p><div class="lobby-actions"><button id="practice" class="primary">Start practice <span>→</span></button><button id="create">Create online duel <span>⚔</span></button></div><div class="join-row"><input id="room-code" maxlength="6" placeholder="ROOM CODE" aria-label="Room code"><button id="join">Join duel →</button></div><p class="development-note">EARLY PLAYABLE DEVELOPMENT SLICE<br>Mirrored factions · Land economy & core armies<br>Full roster, naval play and ancient rulesets are in development.</p><div id="lobby-status" role="status"></div><div id="room-panel" hidden><h2>Room <strong id="room-name"></strong></h2><p id="room-status">Waiting for an opponent…</p><button id="ready" class="primary">Ready to battle</button></div><button id="reconnect" hidden>Reconnect to match</button></div><div class="lobby-art"><div class="sun-disc"></div><div class="mountain m1"></div><div class="mountain m2"></div><div class="castle"><div class="tower t1"></div><div class="keep"></div><div class="tower t2"></div><div class="gate"></div><div class="banner"></div></div><div class="foreground"></div><div class="art-caption">THE BORDERLANDS <span>SCOUT. SETTLE. CONQUER.</span></div></div></main>
  <dialog id="settings"><div class="dialog-title"><h2>Settings & controls</h2><button id="settings-close">Close ✕</button></div><div id="volumes"></div><p class="muted">Original procedural sounds. Synthetic voices are placeholders.</p><h3>Command your realm</h3><p>Click or drag to select · Shift adds selection/queues orders · Double-click selects a type · Right-click to move, gather, repair or attack.</p><p>Arrows pan · Wheel zooms · H selects Town Center · . cycles idle workers · A attack-move · S stop · Ctrl+1–9 assigns a group · 1–9 selects it · Esc cancels placement.</p><p>Gather and deposit resources, build houses for population, train an army and scout the enemy. Conquest requires removing all enemy units and production buildings.</p><button id="resign" class="danger">Resign match</button><div id="sound-preview" hidden><h3>Development sound preview</h3><select id="sound-event" aria-label="Sound event"></select><button id="preview-play">Play sound</button></div></dialog>
  <div id="results" hidden><div><span class="eyebrow">THE BATTLE IS OVER</span><h1 id="result-title"></h1><p id="result-reason"></p><button id="rematch" class="primary">Rematch →</button><button id="return-lobby">Return to lobby</button></div></div>`;
const $ = <T extends HTMLElement = HTMLElement>(id: string) => document.getElementById(id) as T;
const canvas = $<HTMLCanvasElement>('battlefield');
let renderer: GameRenderer;
try { renderer = new GameRenderer(canvas); } catch { $('lobby-status').textContent = '3D rendering could not start. Enable WebGL and reload to retry.'; throw new Error('WebGL unavailable'); }
let view: PlayerView | undefined, selected = new Set<number>(), intent: Intent = null, socket: WebSocket | undefined;
let sequence = 0, epoch = 0, initialFocus = true, closing = false, resultPlayed = false;
let bound = false, retryStopped = false, disconnectedAt = 0, retryTimer: ReturnType<typeof setTimeout> | undefined;
let session: { room: string; token: string } | undefined;
const audio = new AudioEngine(message => notice(message));
const playedEvents = new Set<number>();
function notice(message: string) { $('toast').textContent = message; $('toast').classList.add('show'); setTimeout(() => $('toast').classList.remove('show'), 4500); }
function raw(value: object) { if (socket?.readyState === WebSocket.OPEN) socket.send(JSON.stringify({ version: 1, ...value })); else notice('Connection unavailable. Reconnecting…'); }
function send(command: Command) {
  if (!view || view.result || socket?.readyState !== WebSocket.OPEN) return;
  raw({ type: 'order', epoch, seq: ++sequence, command });
  if ('ids' in command && command.ids.length) {
    const e = view.entities.find(e => e.id === command.ids[0]);
    const family = e?.def === 'villager' ? 'villager' : e?.def === 'scout' ? 'cavalry' : 'soldier';
    const action = command.type === 'gather' ? 'gather' : command.type === 'build' ? 'build' : command.type === 'repair' ? 'repair' : command.type === 'attack' || command.type === 'attackMove' ? 'attack' : 'move';
    const acknowledgment = `voice.${family}_${action}`;
    audio.play(audio.getEventNames().includes(acknowledgment) ? acknowledgment : `voice.${family}_move`);
  } else audio.play('ui.queued');
}
function select(ids: number[]) { selected = new Set(ids); if (view) { hud.update(view, selected); renderer.update(view, selected); } }
function setIntent(next: Intent) {
  intent = next; renderer.setPlacement(next?.type === 'build' ? next.def : null);
  $('intent').textContent = next ? next.type === 'build' ? 'Choose a building site · Esc to cancel' : `${next.type === 'rally' ? 'Rally point' : next.type === 'patrol' ? 'Patrol' : 'Attack move'} · Choose a destination` : '';
}
const hud = new Hud(send, select, setIntent, p => renderer.focus(p));
function receive(m: Record<string, unknown>) {
  if (m.type === 'welcome') {
    session = { room: String(m.room), token: String(m.token) }; sessionStorage.setItem('ironvale.session', JSON.stringify(session)); sequence = Number(m.sequence); epoch = Number(m.epoch);
    $('room-name').textContent = session.room; $('room-panel').hidden = false; $('connection').textContent = `Connected · Room ${session.room}`; bound = true; retryStopped = false; disconnectedAt = 0; clearTimeout(retryTimer); $('reconnect').hidden = true; $('reconnect-game').hidden = true;
  }
  if (m.type === 'lobby') {
    if (Number(m.epoch) !== epoch) { epoch = Number(m.epoch); sequence = 0; view = undefined; selected.clear(); initialFocus = true; resultPlayed = false; playedEvents.clear(); $('results').hidden = true; }
    $('room-status').textContent = Number(m.players) < 2 ? 'Share this room code with your opponent.' : 'Both players connected. Ready when you are.';
    $('ready').hidden = m.running === true;
  }
  if (m.type === 'state') {
    epoch = Number(m.epoch); view = m.view as PlayerView;
    $('lobby').hidden = true; $('hud').classList.add('active'); $('topbar').classList.add('active');
    if (initialFocus) { const tc = view.entities.find(e => e.owner === view!.player && e.def === 'townCenter'); if (tc) { renderer.focus(tc); select([tc.id]); } initialFocus = false; }
    const present = new Set(view.entities.map(e => e.id)); selected = new Set([...selected].filter(id => present.has(id)));
    renderer.update(view, selected); hud.update(view, selected);
    const camera = renderer.getCameraPosition(); audio.setListener(camera.x / 1000, camera.z / 1000);
    for (const event of view.events) if (!playedEvents.has(event.id)) { playedEvents.add(event.id); audio.play(event.name, { x: event.x / 1000, z: event.z / 1000 }); }
    if (playedEvents.size > 4000) { const recent = [...playedEvents].slice(-1000); playedEvents.clear(); recent.forEach(id => playedEvents.add(id)); }
    audio.setBattle(view.events.some(e => e.name.startsWith('combat.') || e.name === 'alerts.under_attack'));
    if (view.result) {
      $('results').hidden = false; $('result-title').textContent = view.result.winner === null ? 'A hard-fought draw' : view.result.winner === view.player ? 'Victory is yours' : 'Your realm has fallen'; $('result-reason').textContent = `Match ended by ${view.result.reason}. Ready for another match?`;
      if (!resultPlayed) { audio.play(view.result.winner === view.player ? 'results.victory' : 'results.defeat'); resultPlayed = true; }
    }
  }
  if (m.type === 'ack' && m.ok === false) { notice(`Order unavailable: ${String(m.reason)}.`); audio.play('ui.error'); }
  if (m.type === 'sequence') { sequence = Number(m.expected) - 1; notice('Orders resynchronized. Please repeat your last order.'); }
  if (m.type === 'error') { const text = String(m.reason); notice(text); $('lobby-status').textContent = text; if (!bound) { retryStopped = true; socket?.close(); } }
  if (m.type === 'notice') notice(String(m.message));
}
function connect(action: object) {
  clearTimeout(retryTimer); closing = false; bound = false; retryStopped = false;
  $('lobby-status').textContent = 'Connecting to the realm…'; $('connection').textContent = 'Connecting…';
  const previous = socket;
  const current = new WebSocket(`${location.protocol === 'https:' ? 'wss' : 'ws'}://${location.host}/socket`);
  socket = current; previous?.close();
  current.onopen = () => { if (socket === current) raw(action); };
  current.onmessage = event => { if (socket !== current) return; try { receive(JSON.parse(event.data) as Record<string, unknown>); } catch { notice('Received an invalid server response.'); } };
  current.onerror = () => { if (socket === current) $('lobby-status').textContent = 'Could not connect. Start the Ironvale server, then retry.'; };
  current.onclose = event => {
    if (socket !== current) return;
    bound = false; $('connection').textContent = 'Disconnected';
    if (closing) return;
    $('reconnect').hidden = !session; $('reconnect-game').hidden = !session || !view;
    if (event.code === 4001) { notice('This seat was opened in another tab.'); return; }
    if (session && !retryStopped && (view || (action as { type?: string }).type === 'reconnect')) {
      disconnectedAt ||= Date.now();
      if (Date.now() - disconnectedAt < 55000) {
        notice('Connection lost. Retrying your reserved seat…');
        retryTimer = setTimeout(() => connect({ type: 'reconnect', ...session }), 1500);
      } else notice('Automatic retries paused. Use Reconnect to try again.');
    }
  };
}
function begin(type: string) {
  if (bound && socket?.readyState === WebSocket.OPEN) { notice('Already connected to a room. Ready up or return to the lobby.'); return; }
  void audio.start().then(() => { audio.setBattle(false); audio.play('ambience.forest'); fillPreview(); });
  connect(type === 'join' ? { type, room: $<HTMLInputElement>('room-code').value.trim().toUpperCase() } : { type });
}
$('practice').onclick = () => begin('practice'); $('create').onclick = () => begin('create'); $('join').onclick = () => begin('join');
$('ready').onclick = () => raw({ type: 'ready' }); $('rematch').onclick = () => { raw({ type: 'rematch' }); notice('Rematch requested.'); }; $('resign').onclick = () => { $<HTMLDialogElement>('settings').close(); send({ type: 'resign' }); };
$('return-lobby').onclick = () => { closing = true; socket?.close(); sessionStorage.removeItem('ironvale.session'); location.reload(); };
function reconnect() { if (session) { disconnectedAt = 0; void audio.start().then(() => { audio.setBattle(false); fillPreview(); }); connect({ type: 'reconnect', ...session }); } }
$('reconnect').onclick = reconnect; $('reconnect-game').onclick = reconnect;
$('idle').onclick = () => hud.idle(); $('town').onclick = () => hud.town();
$('settings-open').onclick = () => $<HTMLDialogElement>('settings').showModal(); $('settings-close').onclick = () => $<HTMLDialogElement>('settings').close();
for (const bus of audioBuses) { const label = document.createElement('label'); label.textContent = bus[0].toUpperCase() + bus.slice(1); const range = document.createElement('input'); range.type = 'range'; range.min = '0'; range.max = '1'; range.step = '.01'; range.value = String(audio.getVolumes()[bus]); range.setAttribute('aria-label', `${bus} volume`); range.oninput = () => audio.setVolume(bus, Number(range.value)); label.append(range); $('volumes').append(label); }
function fillPreview() { if (!import.meta.env.DEV) return; $('sound-preview').hidden = false; const select = $<HTMLSelectElement>('sound-event'); select.replaceChildren(...audio.getEventNames().map(name => { const option = document.createElement('option'); option.value = name; option.textContent = name; return option; })); }
$('preview-play').onclick = () => { void audio.start().then(() => { fillPreview(); audio.play($<HTMLSelectElement>('sound-event').value); }); };
let down: { x: number; y: number; button: number } | undefined;
canvas.oncontextmenu = e => e.preventDefault();
canvas.onpointerdown = e => { down = { x: e.clientX, y: e.clientY, button: e.button }; canvas.setPointerCapture(e.pointerId); };
canvas.onpointermove = e => {
  const point = renderer.screenToWorld(e.clientX, e.clientY);
  if (intent?.type === 'build' && point) renderer.setPlacement(intent.def, point, true);
  if (down?.button === 0 && !intent && Math.hypot(e.clientX - down.x, e.clientY - down.y) > 5) { const box = $('drag-box'); box.style.display = 'block'; box.style.left = `${Math.min(down.x, e.clientX)}px`; box.style.top = `${Math.min(down.y, e.clientY)}px`; box.style.width = `${Math.abs(down.x - e.clientX)}px`; box.style.height = `${Math.abs(down.y - e.clientY)}px`; }
};
canvas.onpointerup = e => {
  if (!view || !down) return; const start = down; down = undefined; $('drag-box').style.display = 'none';
  const point = renderer.screenToWorld(e.clientX, e.clientY); if (!point) return;
  const ids = [...selected], hit = renderer.pick(e.clientX, e.clientY), target = view.entities.find(v => v.id === hit);
  if (e.button === 0 && intent) {
    if (intent.type === 'build') send({ type: 'build', ids, def: intent.def, ...point, queued: e.shiftKey });
    else if (intent.type === 'rally') { if (ids[0]) send({ type: 'rally', building: ids[0], ...point }); }
    else send({ type: intent.type, ids, ...point, queued: e.shiftKey });
    renderer.setOrderMarker(point); if (!e.shiftKey) setIntent(null); return;
  }
  if (e.button === 0) {
    const selection = Math.hypot(e.clientX - start.x, e.clientY - start.y) > 5 ? renderer.selectRect(start.x, start.y, e.clientX, e.clientY) : hit ? [hit] : [];
    select(e.shiftKey ? [...selected, ...selection] : selection); audio.play('ui.select'); return;
  }
  if (e.button === 2) {
    setIntent(null); if (!ids.length) return;
    const own = view.entities.filter(e => selected.has(e.id) && e.owner === view!.player);
    if (own.length === 1 && own[0].kind === 'building') send({ type: 'rally', building: own[0].id, ...point });
    else if (target && target.owner !== -1 && target.owner !== view.player) send({ type: 'attack', ids, target: target.id, queued: e.shiftKey });
    else if (target?.kind === 'resource') send({ type: 'gather', ids, target: target.id, queued: e.shiftKey });
    else if (target?.kind === 'building' && target.owner === view.player) send({ type: (target.progress ?? 1) < 1 ? 'assist' : 'repair', ids, target: target.id, queued: e.shiftKey });
    else send({ type: 'move', ids, ...point, queued: e.shiftKey });
    renderer.setOrderMarker(point);
  }
};
canvas.ondblclick = e => { if (!view) return; const id = renderer.pick(e.clientX, e.clientY), target = view.entities.find(v => v.id === id); if (target) select(view.entities.filter(v => v.owner === view!.player && v.def === target.def && v.visible).map(v => v.id)); };
canvas.addEventListener('wheel', e => { e.preventDefault(); renderer.zoom(e.deltaY); }, { passive: false });
$('minimap').onclick = e => { const r = $('minimap').getBoundingClientRect(); renderer.focus({ x: Math.round((e.clientX - r.left) / r.width * 64000), z: Math.round((e.clientY - r.top) / r.height * 64000) }); };
const groups = new Map<string, number[]>(), keys = new Set<string>();
window.addEventListener('keydown', e => {
  if ((e.target as HTMLElement).matches('input,select,textarea') || $<HTMLDialogElement>('settings').open) return;
  keys.add(e.key); if (e.key.startsWith('Arrow')) e.preventDefault(); if (!view) return;
  if (/^[1-9]$/.test(e.key)) { if (e.ctrlKey) { e.preventDefault(); groups.set(e.key, [...selected]); notice(`Control group ${e.key} assigned.`); } else select(groups.get(e.key) ?? []); }
  if (e.key.toLowerCase() === 'h') hud.town(); if (e.key === '.') hud.idle(); if (e.key.toLowerCase() === 'a') setIntent({ type: 'attackMove' }); if (e.key.toLowerCase() === 's' && selected.size) send({ type: 'stop', ids: [...selected] }); if (e.key === 'Escape') setIntent(null);
});
window.addEventListener('keyup', e => keys.delete(e.key)); window.addEventListener('blur', () => keys.clear());
const pan = setInterval(() => { const x = (keys.has('ArrowRight') ? 1 : 0) - (keys.has('ArrowLeft') ? 1 : 0), z = (keys.has('ArrowDown') ? 1 : 0) - (keys.has('ArrowUp') ? 1 : 0); if (x || z) renderer.pan(x * .5, z * .5); }, 16);
window.addEventListener('beforeunload', () => { closing = true; clearTimeout(retryTimer); socket?.close(); audio.dispose(); renderer.dispose(); clearInterval(pan); });
try { session = JSON.parse(sessionStorage.getItem('ironvale.session') ?? 'null') ?? undefined; if (session) $('reconnect').hidden = false; } catch { session = undefined; }
// Only permitted observations/diagnostics are exposed for local development QA.
if (import.meta.env.DEV) Object.defineProperty(window, 'ironvaleDiagnostics', { get: () => ({ view, renderer: renderer.getDiagnostics(), audio: audio.getDiagnostics() }) });
