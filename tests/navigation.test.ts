import { expect, it } from 'vitest';
import { command, createMatch, step } from '../src/sim/index.js';
import { spawn, distance } from '../src/sim/world.js';
import { blocked } from '../src/sim/navigation.js';
it('bounds total path expansion while many distinct commands eventually make progress', () => {
  const w = createMatch(); w.entities = {}; spawn(w, 1, 'unit', 'villager', 60000, 60000);
  const units = Array.from({ length: 20 }, (_, i) => spawn(w, 0, 'unit', 'villager', 3000, (3 + i) * 1000));
  for (const u of units) command(w, 0, { type: 'move', ids: [u.id], x: 57000, z: u.z });
  for (let i = 0; i < 50; i++) { step(w); expect(w.navigation.expanded).toBeLessThanOrEqual(512); }
  expect(units.every(u => u.x > 3000)).toBe(true);
});
it('separates converging units and never teleports through a new obstacle', () => {
  const w = createMatch(); w.entities = {}; spawn(w, 1, 'unit', 'villager', 60000, 60000);
  const a = spawn(w, 0, 'unit', 'villager', 10000, 10000), b = spawn(w, 0, 'unit', 'villager', 10000, 12000);
  command(w, 0, { type: 'move', ids: [a.id, b.id], x: 15000, z: 11000 });
  for (let i = 0; i < 100; i++) {
    if (i === 15) spawn(w, 0, 'building', 'house', 12000, 11000);
    const before = { x: a.x, z: a.z }; step(w);
    expect(distance(before, a)).toBeLessThanOrEqual(91);
    expect(distance(a, b)).toBeGreaterThanOrEqual(500);
    expect(blocked(w, Math.round(a.x / 1000), Math.round(a.z / 1000))).toBe(false);
  }
  expect(distance(a, { x: 15000, z: 11000 })).toBeLessThan(1500);
  expect(distance(b, { x: 15000, z: 11000 })).toBeLessThan(1500);
});
it('attack-move acquisition cannot move a unit twice in one simulation tick', () => {
  const w = createMatch(); w.entities = {};
  const unit = spawn(w, 0, 'unit', 'militia', 20000, 20000); spawn(w, 1, 'unit', 'villager', 22000, 20000);
  command(w, 0, { type: 'attackMove', ids: [unit.id], x: 30000, z: 20000 });
  const before = { x: unit.x, z: unit.z }; step(w); expect(distance(unit, before)).toBeLessThanOrEqual(101);
});
it('reaches a free destination between grid centers', () => {
  const w = createMatch(); w.entities = {}; spawn(w, 1, 'unit', 'villager', 60000, 60000);
  const unit = spawn(w, 0, 'unit', 'villager', 10000, 10000), target = { x: 12500, z: 12500 };
  command(w, 0, { type: 'move', ids: [unit.id], ...target });
  for (let i = 0; i < 100; i++) step(w);
  expect(distance(unit, target)).toBeLessThanOrEqual(120);
  expect(unit.order).toBeUndefined();
});
it('attack-move toward a distant occupied building approaches and engages it', () => {
  const w = createMatch(); w.entities = {};
  const unit = spawn(w, 0, 'unit', 'militia', 10000, 10000);
  const target = spawn(w, 1, 'building', 'house', 20000, 10000); spawn(w, 1, 'unit', 'villager', 60000, 60000);
  command(w, 0, { type: 'attackMove', ids: [unit.id], x: target.x, z: target.z });
  for (let i = 0; i < 150; i++) step(w);
  expect(target.hp).toBeLessThan(target.maxHp);
});

import { checkpoint } from '../src/sim/replay.js';
import { updateVisibility } from '../src/sim/visibility.js';
it.each(['distant', 'detoured'] as const)('accepts a %s reachable construction site without spending movement-search budget', scenario => {
  const w = createMatch(); w.entities = {};
  const worker = spawn(w, 0, 'unit', 'villager', 3000, 3000);
  const target = scenario === 'distant' ? { x: 58000, z: 58000 } : { x: 12000, z: 10000 };
  spawn(w, 0, 'unit', 'scout', target.x + 2000, target.z);
  spawn(w, 1, 'unit', 'villager', 60000, 3000);
  if (scenario === 'detoured') for (let z = 1; z <= 55; z++) spawn(w, -1, 'resource', 'wood', 10000, z * 1000);
  updateVisibility(w); const budget = structuredClone(w.navigation), routes = structuredClone(w.routes), wood = w.players[0].resources.wood;
  expect(command(w, 0, { type: 'build', ids: [worker.id], def: 'house', ...target })).toEqual({ ok: true });
  expect(w.players[0].resources.wood).toBe(wood - 25);
  expect(Object.values(w.entities).filter(e => e.def === 'house')).toHaveLength(1);
  expect(w.navigation).toEqual(budget); expect(w.routes).toEqual(routes);
  expect(command(w, 0, { type: 'build', ids: [worker.id], def: 'house', ...target }).ok).toBe(false);
  expect(w.players[0].resources.wood).toBe(wood - 25);
});
it('rejects an enclosed visible construction site without changing the canonical state or treasury', () => {
  const w = createMatch(); w.entities = {};
  const worker = spawn(w, 0, 'unit', 'villager', 8000, 16000);
  spawn(w, 0, 'unit', 'scout', 12000, 16000); spawn(w, 1, 'unit', 'villager', 60000, 3000);
  for (let x = 13; x <= 19; x++) for (let z = 13; z <= 19; z++) if (x === 13 || x === 19 || z === 13 || z === 19) spawn(w, -1, 'resource', 'wood', x * 1000, z * 1000);
  updateVisibility(w); const hash = checkpoint(w), resources = { ...w.players[0].resources };
  expect(command(w, 0, { type: 'build', ids: [worker.id], def: 'house', x: 16000, z: 16000 })).toEqual({ ok: false, reason: 'blocked' });
  expect(checkpoint(w)).toBe(hash); expect(w.players[0].resources).toEqual(resources);
});
