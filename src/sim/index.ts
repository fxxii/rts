import { createMatch as createWorld } from './world.js';
import { command } from './commands.js';
import { updateVisibility, observe } from './visibility.js';
import { combatStep, resolveAttacks, applyDamage, checkVictory } from './combat.js';
import { finishOrder, productionStep, workerStep } from './economy.js';
import { walk } from './navigation.js';
import type { World } from './types.js';
export { command, observe };
export function createMatch(seed = 1): World { const w = createWorld(seed); updateVisibility(w); return w; }
export function step(w: World): void {
  if (w.result) return;
  if (w.tick % 5 === 0) { w.events = []; for (const player of w.players) player.events = []; }
  const damage = new Map<number, number>();
  for (const e of Object.values(w.entities)) {
    if (e.hp <= 0 || e.container) continue;
    if (e.kind === 'building') productionStep(w, e);
    const engaged = combatStep(w, e, damage);
    if (e.kind === 'unit' && e.order && !engaged) {
      const o = e.order;
      if (o.type === 'move' || o.type === 'attackMove' || o.type === 'patrol') {
        if (walk(w, e, o, 120)) {
          if (o.type === 'patrol' && o.origin) { const old = { x: o.x, z: o.z }; o.x = o.origin.x; o.z = o.origin.z; o.origin = old; }
          else finishOrder(e);
        }
      } else if (e.def === 'villager') workerStep(w, e);
    }
  }
  resolveAttacks(w, damage);
  applyDamage(w, damage); w.tick++; updateVisibility(w); checkVictory(w);
}
