import { CONTENT } from '../content/catalog.js';
import type { Entity, World } from './types.js';
import { distance, emit } from './world.js';
import { canSee } from './visibility.js';
import { walk } from './navigation.js';
import { finishOrder } from './economy.js';
export function combatStep(w: World, e: Entity, _damage: Map<number, number>): boolean {
  if (e.owner === -1 || e.container || e.hp <= 0) return false;
  const def = e.kind === 'unit' ? CONTENT.units[e.def] : CONTENT.buildings[e.def];
  if (!def || !def.attack || (e.kind === 'building' && e.progress < e.buildTotal)) return false;
  if (e.cooldown > 0) e.cooldown--;
  const order = e.order;
  const aggressive = e.kind === 'building' || (e.kind === 'unit' && CONTENT.units[e.def].category !== 'worker' && (!order || ['attack', 'attackMove', 'hold', 'patrol'].includes(order.type))) || order?.type === 'attack';
  if (!aggressive) return false;
  let target = order?.type === 'attack' && order.target ? w.entities[order.target] : undefined;
  if (target && (!canSee(w, e.owner, target) || target.owner === e.owner || target.container)) target = undefined;
  if (!target) {
    target = Object.values(w.entities).filter(t => t.owner !== -1 && t.owner !== e.owner && t.hp > 0 && !t.container && distance(e, t) <= def.range + (e.kind === 'unit' && order?.type !== 'hold' ? 1500 : 0) && canSee(w, e.owner as 0 | 1, t))
      .sort((a, b) => distance(e, a) - distance(e, b) || a.id - b.id)[0];
  }
  if (!target) { if (order?.type === 'attack') finishOrder(e); return false; }
  const range = def.range + (target.kind === 'building' ? CONTENT.buildings[target.def].size * 500 : 0);
  if (distance(e, target) > range) { if (e.kind === 'unit' && order?.type !== 'hold') walk(w, e, target, range); return true; }
  e.path = [];
  if (e.cooldown > 0) return true;
  const unitDef = CONTENT.units[e.def], targetDef = CONTENT.units[target.def];
  const bonus = targetDef && unitDef?.bonus?.[targetDef.category] || 0;
  const amount = Math.max(1, def.attack + (w.players[e.owner].researched.includes('forging') ? 1 : 0) + bonus - (targetDef?.armor ?? 1));
  const ranged = def.range > 2000;
  w.attacks.push({ attacker: e.id, target: target.id, release: w.tick + 6, impact: w.tick + 6 + (ranged ? Math.ceil(distance(e, target) / 500) : 0), damage: amount, ranged, released: false });
  e.cooldown = unitDef?.cooldown ?? 30;

  if (w.tick % 40 === 0) emit(w, 'alerts.under_attack', target);
  return true;
}
// Foundation timing: six-tick windup, ranged travel at 500 world units/tick.
// Released projectiles persist after attacker death; melee requires a live attacker in range.
export function resolveAttacks(w: World, damage: Map<number, number>): void {
  w.attacks = w.attacks.filter(attack => {
    const source = w.entities[attack.attacker], target = w.entities[attack.target];
    if (!target || target.hp <= 0 || target.container) return false;
    if (!attack.released && w.tick >= attack.release) {
      if (!source || source.hp <= 0 || source.container) return false;
      const def = source.kind === 'unit' ? CONTENT.units[source.def] : CONTENT.buildings[source.def];
      const range = def.range + (target.kind === 'building' ? CONTENT.buildings[target.def].size * 500 : 0);
      if (distance(source, target) > range) return false;
      attack.released = true;
      emit(w, attack.ranged ? 'combat.bow_release' : source.def === 'spearman' ? 'combat.spear_thrust' : 'combat.sword_swing', source);
    }
    if (attack.released && w.tick >= attack.impact) {
      damage.set(target.id, (damage.get(target.id) ?? 0) + attack.damage);
      emit(w, 'alerts.under_attack', target);
      return false;
    }
    return true;
  });
}
export function applyDamage(w: World, damage: Map<number, number>): void {
  for (const [id, amount] of damage) { const e = w.entities[id]; if (e) e.hp -= amount; }
  for (const e of Object.values(w.entities)) if (e.hp <= 0) {
    emit(w, e.kind === 'building' ? 'siege.building_collapse' : 'combat.unit_death', e);
    for (const id of e.passengers) delete w.entities[id];
    delete w.entities[e.id]; if (e.kind !== 'unit') { w.revision++; w.routes = {}; }
  }
}
export function checkVictory(w: World): void {
  if (w.result) return;
  const alive = [0, 1].map(p => Object.values(w.entities).some(e => e.owner === p && e.hp > 0 && (e.kind === 'unit' || (e.kind === 'building' && e.progress >= e.buildTotal && CONTENT.buildings[e.def].trains.length > 0))));
  if (!alive[0] || !alive[1]) w.result = { winner: alive[0] ? 0 : alive[1] ? 1 : null, reason: 'conquest' };
}
