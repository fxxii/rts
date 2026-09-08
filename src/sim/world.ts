import { CONTENT } from '../content/catalog.js';
import type { Cost, Stock } from '../content/types.js';
import type { GameEvent, PlayerId, Point } from '../protocol/types.js';
import type { Entity, PlayerState, World } from './types.js';
export const RESOURCES = ['food', 'wood', 'gold', 'stone'] as const;
export const stock = (cost: Cost = {}): Stock => ({ food: cost.food ?? 0, wood: cost.wood ?? 0, gold: cost.gold ?? 0, stone: cost.stone ?? 0 });
export function pay(w: World, p: PlayerId, cost: Cost): boolean {
  if (RESOURCES.some(r => w.players[p].resources[r] < (cost[r] ?? 0))) return false;
  for (const r of RESOURCES) w.players[p].resources[r] -= cost[r] ?? 0;
  return true;
}
export function refund(w: World, p: PlayerId, cost: Stock, fraction = 1): void { for (const r of RESOURCES) w.players[p].resources[r] += Math.floor(cost[r] * fraction); }
export function distance(a: Point, b: Point): number { return Math.hypot(a.x - b.x, a.z - b.z); }
export function population(w: World, p: PlayerId): number { return Object.values(w.entities).filter(e => e.owner === p && e.kind === 'unit' && e.hp > 0).reduce((n, e) => n + (CONTENT.units[e.def]?.population ?? 1), 0); }
export function capacity(w: World, p: PlayerId): number { return Math.min(200, Object.values(w.entities).filter(e => e.owner === p && e.kind === 'building' && e.progress >= e.buildTotal && e.hp > 0).reduce((n, e) => n + CONTENT.buildings[e.def].population, 0)); }
export function emit(w: World, name: string, entity: Pick<Entity, 'id' | 'owner' | 'x' | 'z'>): void {
  const event: GameEvent = { id: w.nextEvent++, name, owner: entity.owner, x: entity.x, z: entity.z, entity: entity.id };
  w.events.push(event);
}
export function spawn(w: World, owner: PlayerId | -1, kind: Entity['kind'], def: string, x: number, z: number): Entity {
  const d = kind === 'unit' ? CONTENT.units[def] : CONTENT.buildings[def];
  const hp = kind === 'resource' ? 1 : d.hp;
  const e: Entity = { id: w.nextId++, owner, kind, def, x, z, hp, maxHp: hp, progress: 0, buildTotal: 0, paid: stock(), amount: 0, carry: 0,
    orders: [], path: [], routeRevision: -1, nextPathTick: 0, stuck: 0, work: 0, cooldown: 0, queue: [], passengers: [] };
  if (kind === 'building') { e.buildTotal = d.ticks; e.progress = d.ticks; w.revision++; }
  w.entities[e.id] = e; return e;
}
function random(w: World): number { w.random = (Math.imul(w.random, 1664525) + 1013904223) >>> 0; return w.random / 4294967296; }
export function createMatch(seed = 1): World {
  const player = (): PlayerState => ({ events: [], eventCursor: 0, nextEventRef: 1, resources: stock({ food: 200, wood: 300, gold: 150, stone: 100 }), age: 0, researched: [], explored: [], visible: [], memory: {}, refs: {}, nextRef: 1 });
  const w: World = { navigation: { tick: -1, expanded: 0, searches: {} }, version: CONTENT.version, seed, random: seed >>> 0, tick: 0, width: 64, height: 64, nextId: 1, nextEvent: 1, entities: {}, players: [player(), player()], attacks: [], events: [], result: null, revision: 0, routes: {}, log: [] };
  for (const p of [0, 1] as const) {
    const pos = (n: number) => (p === 0 ? n : 63 - n) * 1000;
    spawn(w, p, 'building', 'townCenter', pos(8), pos(8));
    for (let i = 0; i < 3; i++) spawn(w, p, 'unit', 'villager', pos(7 + i), pos(10));
    spawn(w, p, 'unit', 'scout', pos(5), pos(10));
    for (const [resource, x, z, amount] of [['food', 12, 8, 1200], ['gold', 14, 6, 2200], ['stone', 6, 14, 1500], ['wood', 11, 14, 500]] as const) {
      const e = spawn(w, -1, 'resource', resource, pos(x), pos(z)); e.resource = resource; e.amount = amount;
    }
  }
  for (let i = 0; i < 45; i++) {
    const x = 18 + Math.floor(random(w) * 12), z = 4 + Math.floor(random(w) * 50);
    for (const mirror of [false, true]) {
      const px = (mirror ? 63 - x : x) * 1000, pz = (mirror ? 63 - z : z) * 1000;
      if (Object.values(w.entities).some(e => distance(e, { x: px, z: pz }) < 1300)) continue;
      const e = spawn(w, -1, 'resource', 'wood', px, pz); e.resource = 'wood'; e.amount = 350;
    }
  }
  return w;
}
