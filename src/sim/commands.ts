import { CONTENT } from '../content/catalog.js';
import type { Command, CommandResult, PlayerId } from '../protocol/types.js';
import { decodeCommand } from '../protocol/decode.js';
import type { Entity, Order, World } from './types.js';
import { canReachAny, cell, footprintFree } from './navigation.js';
import { canSee, updateVisibility } from './visibility.js';
import { emit, pay, refund, spawn, stock } from './world.js';
const fail = (reason: Extract<CommandResult, { ok: false }>['reason']): CommandResult => ({ ok: false, reason });
function assign(e: Entity, order: Order, queued = false): void {
  if (queued && e.order) e.orders.push(order);
  else { e.order = order; e.orders = []; e.path = []; e.nextPathTick = 0; e.stuck = 0; }
}
export function command(w: World, p: PlayerId, input: Command): CommandResult {
  if (w.result) return fail('finished');
  const c = decodeCommand(input); if (!c || (p !== 0 && p !== 1)) return fail('invalid');
  updateVisibility(w);
  const result = execute(w, p, c);
  if (result.ok && 'ids' in c && !('queued' in c && c.queued)) w.attacks = w.attacks.filter(a => a.released || !c.ids.includes(a.attacker));
  updateVisibility(w);
  if (result.ok) w.log.push({ tick: w.tick, player: p, command: structuredClone(c) });
  return result;
}
function execute(w: World, p: PlayerId, c: Command): CommandResult {
  const player = w.players[p];
  if (c.type === 'resign') { w.result = { winner: p === 0 ? 1 : 0, reason: 'resignation' }; return { ok: true }; }
  if ('building' in c) {
    const b = w.entities[c.building];
    if (!b || b.owner !== p || b.kind !== 'building') return fail('ownership');
    if (c.type === 'cancel') {
      if (c.index === -1 && b.progress < b.buildTotal) { refund(w, p, b.paid, 1 - b.progress / b.buildTotal); delete w.entities[b.id]; w.revision++; return { ok: true }; }
      const q = b.queue[c.index]; if (!q) return fail('invalid');
      refund(w, p, q.paid); b.queue.splice(c.index, 1); return { ok: true };
    }
    if (c.type === 'rally') { b.rally = { x: c.x, z: c.z }; return { ok: true }; }
    if (b.progress < b.buildTotal) return fail('prerequisite');
    const def = c.type === 'train' ? CONTENT.units[c.def] : CONTENT.techs[c.def];
    if (!def || def.producer !== b.def || def.age > player.age) return fail('prerequisite');
    if (c.type === 'research') {
      const t = CONTENT.techs[c.def];
      if (player.researched.includes(c.def) || t.requires.some(r => !player.researched.includes(r)) || Object.values(w.entities).some(e => e.owner === p && e.queue.some(q => q.def === c.def))) return fail('prerequisite');
    }
    if (b.queue.length >= 32) return fail('queueFull');
    if (!pay(w, p, def.cost)) return fail('resources');
    b.queue.push({ def: c.def, kind: c.type === 'train' ? 'unit' : 'tech', remaining: def.ticks, total: def.ticks, paid: stock(def.cost) });
    return { ok: true };
  }
  const units = c.ids.map(id => w.entities[id]);
  if (units.some(e => !e || e.owner !== p || e.kind !== 'unit' || e.container)) return fail('ownership');
  if ('queued' in c && c.queued && units.some(e => e.orders.length >= 32)) return fail('queueFull');
  if (c.type === 'stop' || c.type === 'hold') {
    for (const e of units) { e.order = c.type === 'hold' ? { type: 'hold', x: e.x, z: e.z } : undefined; e.orders = []; e.path = []; }
    return { ok: true };
  }
  if (c.type === 'build') {
    const d = Object.hasOwn(CONTENT.buildings, c.def) ? CONTENT.buildings[c.def] : undefined; if (!d || d.age > player.age || units.some(e => e.def !== 'villager')) return fail('prerequisite');
    const point = { x: Math.round(c.x / 1000) * 1000, z: Math.round(c.z / 1000) * 1000 };
    const half = Math.floor(d.size / 2);
    for (let dz = -half; dz <= half; dz++) for (let dx = -half; dx <= half; dx++) if (!player.visible.includes(cell(w, { x: point.x + dx * 1000, z: point.z + dz * 1000 }))) return fail('placement');
    if (!footprintFree(w, c.def, point)) return fail('placement');
    if (!canReachAny(w, units, point)) return fail('blocked');
    if (!pay(w, p, d.cost)) return fail('resources');
    const building = spawn(w, p, 'building', c.def, point.x, point.z); building.progress = 0; building.hp = 1; building.paid = stock(d.cost);
    for (const e of units) assign(e, { type: 'assist', target: building.id, ...point }, c.queued);
    return { ok: true };
  }
  if (c.type === 'move' || c.type === 'attackMove' || c.type === 'patrol') {
    if (c.x < 1000 || c.z < 1000 || c.x >= (w.width - 1) * 1000 || c.z >= (w.height - 1) * 1000) return fail('blocked');
    for (const e of units) assign(e, { type: c.type, x: c.x, z: c.z, origin: { x: e.x, z: e.z } }, c.queued);
    return { ok: true };
  }
  if (!('target' in c)) return fail('invalid');
  const target = w.entities[c.target]; if (!target || target.hp <= 0 || !canSee(w, p, target)) return fail('target');
  if (c.type === 'attack' && (target.owner === p || target.kind === 'resource')) return fail('target');
  if (['repair', 'assist', 'deposit'].includes(c.type) && (target.owner !== p || target.kind !== 'building')) return fail('target');
  if (c.type === 'gather' && (target.kind !== 'resource' || target.amount <= 0)) return fail('target');
  if (c.type !== 'attack' && units.some(e => e.def !== 'villager')) return fail('prerequisite');
  for (const e of units) assign(e, { type: c.type, x: target.x, z: target.z, target: target.id, source: c.type === 'gather' ? target.id : undefined, resource: c.type === 'gather' ? target.resource : undefined }, c.queued);
  emit(w, 'ui.queued', units[0]); return { ok: true };
}
