import { CONTENT } from '../content/catalog.js';
import type { Command, PlayerView, ViewEntity, Point } from '../protocol/types.js';
export type Intent = { type: 'build'; def: string } | { type: 'attackMove' | 'patrol' | 'rally' } | null;
export const nameOf = (id: string): string => CONTENT.units[id]?.name ?? CONTENT.buildings[id]?.name ?? CONTENT.techs[id]?.name ?? id[0].toUpperCase() + id.slice(1);
const costs = (cost: Record<string, number | undefined>): string => Object.entries(cost).map(([k, v]) => `${v} ${k}`).join(' · ');
const button = (label: string, action: () => void, reason?: string, small?: string): HTMLButtonElement => {
  const b = document.createElement('button'); b.className = 'command'; b.disabled = !!reason; b.title = reason ?? small ?? label;
  const span = document.createElement('span'); span.textContent = label; b.append(span);
  if (small || reason) { const sub = document.createElement('small'); sub.textContent = reason ?? small ?? ''; b.append(sub); }
  b.onclick = action; return b;
};
export class Hud {
  private view?: PlayerView;
  private selected = new Set<number>();
  private lastSignature = '';
  constructor(private send: (c: Command) => void, private select: (ids: number[]) => void, private intent: (i: Intent) => void, private focus: (p: Point) => void) {}
  update(view: PlayerView, selected: Set<number>): void {
    this.view = view; this.selected = selected;
    for (const r of ['food', 'wood', 'gold', 'stone'] as const) document.querySelector(`#${r}`)!.textContent = `${view.resources[r]}`;
    document.querySelector('#population')!.textContent = `${view.population} / ${view.capacity}`;
    document.querySelector('#age')!.textContent = ['Dark Age', 'Feudal Age', 'Castle Age', 'Imperial Age'][view.age];
    document.querySelector('#clock')!.textContent = `${Math.floor(view.tick / 1200).toString().padStart(2, '0')}:${Math.floor(view.tick / 20 % 60).toString().padStart(2, '0')}`;
    const idle = view.entities.filter(e => e.owner === view.player && e.def === 'villager' && e.activity === 'idle');
    document.querySelector('#idle')!.textContent = `◇ ${idle.length} idle workers`;
    const signature = JSON.stringify([view.resources, view.population, view.capacity, view.age, view.researched, [...selected], view.entities.filter(e => selected.has(e.id))]);
    if (signature !== this.lastSignature) { this.lastSignature = signature; this.panel(); }
    this.minimap();
  }
  private panel(): void {
    const view = this.view!;
    const es = view.entities.filter(e => this.selected.has(e.id)), e = es[0];
    document.querySelector('#selection-title')!.textContent = e ? es.length > 1 ? `${es.length} selected` : nameOf(e.def) : 'Your settlement awaits';
    document.querySelector('#selection-detail')!.textContent = e ? `${Math.ceil(e.hp)} / ${e.maxHp} health${e.activity ? ` · ${e.activity}` : ''}${e.carried ? ` · carrying ${e.carried} ${e.cargo}` : ''}` : 'Select a worker to gather, or your Town Center to grow.';
    const portrait = document.querySelector('#portrait')!; portrait.textContent = e ? e.kind === 'building' ? '♜' : e.def === 'scout' ? '♞' : e.def === 'archer' ? '➶' : '⚑' : '♜';
    const panel = document.querySelector('#commands')!; panel.replaceChildren();
    const queue = document.querySelector('#queue')!; queue.replaceChildren();
    if (!e || e.owner !== view.player) return;
    const reason = (def: { age: number; cost: Record<string, number | undefined> }) => def.age > view.age ? `Requires ${['Dark', 'Feudal', 'Castle', 'Imperial'][def.age]} Age` : Object.entries(def.cost).some(([r, n]) => view.resources[r as keyof typeof view.resources] < (n ?? 0)) ? 'Not enough resources' : undefined;
    if (e.kind === 'unit') {
      const ids = es.filter(e => e.kind === 'unit' && e.owner === view.player).map(e => e.id);
      panel.append(button('Move / interact', () => this.intent(null), undefined, 'Right-click destination'), button('Attack move', () => this.intent({ type: 'attackMove' }), undefined, 'A · choose destination'), button('Stop', () => this.send({ type: 'stop', ids }), undefined, 'S'), button('Hold position', () => this.send({ type: 'hold', ids })), button('Patrol', () => this.intent({ type: 'patrol' })));
      if (es.every(e => e.def === 'villager')) {
        for (const resource of ['food', 'wood', 'gold', 'stone']) {
          const target = view.entities.filter(r => r.kind === 'resource' && r.resource === resource && r.visible).sort((a, b) => Math.hypot(a.x - e.x, a.z - e.z) - Math.hypot(b.x - e.x, b.z - e.z))[0];
          panel.append(button(`Gather ${resource}`, () => this.send({ type: 'gather', ids, target: target.id }), target ? undefined : 'Scout to find a source'));
        }
        for (const def of Object.values(CONTENT.buildings)) panel.append(button(`Build ${def.name}`, () => this.intent({ type: 'build', def: def.id }), reason(def), costs(def.cost)));
      }
    }
    if (e.kind === 'building') {
      const def = CONTENT.buildings[e.def];
      if ((e.progress ?? 1) < 1) {
        panel.append(button('Cancel construction', () => this.send({ type: 'cancel', building: e.id, index: -1 }), undefined, 'Refund unbuilt portion'));
      } else {
        for (const id of def.trains) { const unit = CONTENT.units[id]; panel.append(button(`Train ${unit.name}`, () => this.send({ type: 'train', building: e.id, def: id }), reason(unit), `${costs(unit.cost)} · ${unit.ticks / 20}s`)); }
        for (const id of def.research) {
          const tech = CONTENT.techs[id];
          const why = view.researched.includes(id) ? 'Completed' : tech.requires.some(t => !view.researched.includes(t)) ? `Requires ${tech.requires.map(nameOf).join(', ')}` : reason(tech);
          panel.append(button(tech.name, () => this.send({ type: 'research', building: e.id, def: id }), why, `${costs(tech.cost)} · ${tech.ticks / 20}s`));
        }
        if (def.trains.length) panel.append(button('Set rally point', () => this.intent({ type: 'rally' }), undefined, 'Choose destination'));
      }
      e.queue?.forEach((q, index) => {
        const b = button(`${nameOf(q.def)} · ${Math.ceil(q.remaining / 20)}s`, () => this.send({ type: 'cancel', building: e.id, index }), undefined, q.blocked ?? 'Click to cancel and refund');
        b.style.setProperty('--progress', `${100 * (1 - q.remaining / q.total)}%`); b.classList.add('queue-item'); queue.append(b);
      });
    }
  }
  private minimap(): void {
    const v = this.view!, canvas = document.querySelector<HTMLCanvasElement>('#minimap')!, ctx = canvas.getContext('2d')!;
    const scale = canvas.width / v.width; ctx.fillStyle = '#172c30'; ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#344c40'; for (const n of v.explored) ctx.fillRect(n % v.width * scale, Math.floor(n / v.width) * scale, scale, scale);
    ctx.fillStyle = '#728661'; for (const n of v.visible) ctx.fillRect(n % v.width * scale, Math.floor(n / v.width) * scale, scale, scale);
    for (const e of v.entities) { ctx.fillStyle = e.owner === v.player ? '#85dfc3' : e.owner === -1 ? e.resource === 'gold' ? '#ebc368' : '#273e32' : '#e9987b'; const r = e.kind === 'building' ? 5 : 3; ctx.fillRect(e.x / 1000 * scale - r / 2, e.z / 1000 * scale - r / 2, r, r); }
  }
  idle(): void {
    const candidates = this.view?.entities.filter(e => e.owner === this.view?.player && e.def === 'villager' && e.activity === 'idle') ?? [];
    const index = candidates.findIndex(e => this.selected.has(e.id)), e = candidates[(index + 1) % candidates.length]; if (e) { this.select([e.id]); this.focus(e); }
  }
  town(): void { const e: ViewEntity | undefined = this.view?.entities.find(e => e.owner === this.view?.player && e.def === 'townCenter'); if (e) { this.select([e.id]); this.focus(e); } }
}
