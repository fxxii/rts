import { CONTENT } from '../content/catalog.js';
import type { Entity, World } from './types.js';
import { distance, emit, capacity, pay, population, spawn } from './world.js';
import { canSee } from './visibility.js';
import { openNear, walk } from './navigation.js';
export function finishOrder(e: Entity): void { e.order = e.orders.shift(); e.path = []; e.nextPathTick = 0; e.stuck = 0; }
function dropoff(w: World, e: Entity): Entity | undefined {
  return Object.values(w.entities).filter(b => (e.failedDropoffs?.[b.id] ?? 0) <= w.tick && b.owner === e.owner && b.kind === 'building' && b.hp > 0 && b.progress >= b.buildTotal && e.cargo && CONTENT.buildings[b.def].dropoff.includes(e.cargo)).sort((a, b) => distance(e, a) - distance(e, b) || a.id - b.id)[0];
}
function deposit(w: World, e: Entity): boolean {
  if (!e.carry || !e.cargo) return true;
  const b = dropoff(w, e); if (!b) { e.path = []; return false; }
  const before = { x: e.x, z: e.z };
  if (!walk(w, e, b, CONTENT.buildings[b.def].size * 500 + 650)) {
    e.dropoffWait = distance(e, before) < 1 ? (e.dropoffWait ?? 0) + 1 : 0;
    if (e.dropoffWait >= 100) { (e.failedDropoffs ??= {})[b.id] = w.tick + 300; e.dropoffWait = 0; e.path = []; e.nextPathTick = 0; }
    return false;
  }
  e.dropoffWait = 0; e.failedDropoffs = {};
  if (e.owner !== -1) w.players[e.owner].resources[e.cargo] += e.carry;
  e.carry = 0; e.cargo = undefined; e.work = 0; e.path = []; emit(w, 'economy.deposit', e); return true;
}
export function workerStep(w: World, e: Entity): void {
  const o = e.order; if (!o || e.owner === -1) return;
  if (o.type === 'gather' || o.type === 'deposit') {
    let source = o.target ? w.entities[o.target] : undefined;
    if (o.type === 'deposit') { if (deposit(w, e)) finishOrder(e); return; }
    if (e.carry >= 10 || (e.cargo && source?.resource !== e.cargo) || (!source && e.carry > 0) || o.returning) {
      o.returning = true; if (deposit(w, e)) o.returning = false; return;
    }
    if (!source || source.amount <= 0) {
      const kind = o.resource ?? source?.resource ?? e.cargo;
      source = Object.values(w.entities).filter(r => r.kind === 'resource' && r.amount > 0 && (!kind || r.resource === kind) && canSee(w, e.owner as 0 | 1, r)).sort((a, b) => distance(e, a) - distance(e, b) || a.id - b.id)[0];
      if (!source) { finishOrder(e); return; } o.target = source.id; o.resource = source.resource; e.path = [];
    }
    if (!walk(w, e, source, 1250)) return;
    e.work += w.players[e.owner].researched.includes('tools') ? 2 : 1;
    if (e.work >= 20) {
      e.work -= 20; e.carry++; e.cargo = source.resource; source.amount--;
      emit(w, source.resource === 'wood' ? 'economy.wood_chop' : source.resource === 'food' ? 'economy.harvest' : 'economy.mine_strike', e);
      if (source.amount <= 0) { delete w.entities[source.id]; w.revision++; }
    }
    return;
  }
  if (o.type === 'assist' || o.type === 'repair') {
    const b = o.target ? w.entities[o.target] : undefined;
    if (!b || b.owner !== e.owner || b.hp <= 0) { finishOrder(e); return; }
    if (!walk(w, e, b, CONTENT.buildings[b.def].size * 500 + 700)) return;
    if (b.progress < b.buildTotal) {
      const builders = Object.values(w.entities).filter(u => u.owner === e.owner && u.order?.target === b.id && u.order.type === 'assist' && distance(u, b) < 2500).sort((a, c) => a.id - c.id);
      const rank = Math.max(0, builders.findIndex(u => u.id === e.id));
      if (w.tick % (rank + 1) !== 0) return;
      const before = Math.floor(b.progress / b.buildTotal * b.maxHp); b.progress++;
      b.hp = Math.min(b.maxHp, b.hp + Math.floor(b.progress / b.buildTotal * b.maxHp) - before);
      if (w.tick % 20 === 0) emit(w, 'economy.build_hammer', e);
      if (b.progress >= b.buildTotal) { emit(w, 'alerts.building_complete', b); finishOrder(e); }
    } else if (o.type === 'repair' && b.hp < b.maxHp) {
      if (++e.work >= 10) { e.work = 0; if (pay(w, e.owner, { wood: 1 })) { b.hp = Math.min(b.maxHp, b.hp + 8); emit(w, 'economy.repair_hammer', e); } }
    } else finishOrder(e);
  }
}
export function productionStep(w: World, b: Entity): void {
  if (b.owner === -1 || b.progress < b.buildTotal || !b.queue.length) return;
  const q = b.queue[0]; q.remaining = Math.max(0, q.remaining - 1);
  if (q.remaining > 0) return;
  if (q.kind === 'tech') {
    const t = CONTENT.techs[q.def], p = w.players[b.owner];
    p.researched.push(t.id); if (t.effect === 'age') p.age = t.value;
    emit(w, t.effect === 'age' ? 'alerts.age_complete' : 'alerts.research_complete', b); b.queue.shift(); return;
  }
  if (population(w, b.owner) + CONTENT.units[q.def].population > capacity(w, b.owner)) { q.blocked = 'Population full — build a house'; return; }
  const spot = openNear(w, b, 4, true); if (!spot) { q.blocked = 'Spawn blocked — clear space'; return; }
  const u = spawn(w, b.owner, 'unit', q.def, spot.x, spot.z); b.queue.shift();
  if (b.rally) u.order = { type: 'move', ...b.rally };
  emit(w, 'alerts.unit_complete', b);
}
