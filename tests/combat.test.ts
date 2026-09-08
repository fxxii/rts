import { expect, it } from 'vitest';
import { createMatch, command, step } from '../src/sim/index.js';
it('rejects an enemy order without changing that entity', () => {
  const w = createMatch(); const enemy = Object.values(w.entities).find(e => e.owner === 1 && e.kind === 'unit')!;
  expect(command(w, 0, { type: 'move', ids: [enemy.id], x: 1000, z: 1000 })).toEqual({ ok: false, reason: 'ownership' });
  expect(enemy.order).toBeUndefined();
});
it('resignation finalizes a normal outcome and prevents further spending', () => {
  const w = createMatch(); command(w, 0, { type: 'resign' }); step(w);
  expect(w.result).toEqual({ winner: 1, reason: 'resignation' });
  expect(command(w, 1, { type: 'resign' })).toEqual({ ok: false, reason: 'finished' });
});

import { spawn } from '../src/sim/world.js';
function duel(a = 'militia', b = 'militia', separation = 1000) {
  const w = createMatch(); w.entities = {};
  const attacker = spawn(w, 0, 'unit', a, 20000, 20000);
  const target = spawn(w, 1, 'unit', b, 20000 + separation, 20000);
  expect(command(w, 0, { type: 'attack', ids: [attacker.id], target: target.id }).ok).toBe(true);
  command(w, 1, { type: 'hold', ids: [target.id] });
  return { w, attacker, target };
}
it('winds up melee attacks and retains cooldown across stop and retask', () => {
  const { w, attacker, target } = duel();
  step(w); expect(target.hp).toBe(60);
  for (let i = 0; i < 6; i++) step(w);
  expect(target.hp).toBe(54);
  command(w, 0, { type: 'stop', ids: [attacker.id] });
  command(w, 0, { type: 'attack', ids: [attacker.id], target: target.id });
  for (let i = 0; i < 20; i++) step(w);
  expect(target.hp).toBe(54);
});
it('adds ranged travel after release before applying damage', () => {
  const { w, target } = duel('archer', 'villager', 5000);
  for (let i = 0; i < 10; i++) step(w);
  expect(target.hp).toBe(30);
  for (let i = 0; i < 7; i++) step(w);
  expect(target.hp).toBe(26);
});
it('applies exact cavalry bonus and forging damage', () => {
  const { w, target } = duel('spearman', 'scout'); w.players[0].researched.push('forging');
  for (let i = 0; i < 7; i++) step(w);
  expect(target.hp).toBe(46);
});
it('resolves same-tick lethal melee impacts as a draw', () => {
  const { w, attacker, target } = duel(); attacker.hp = target.hp = 6;
  for (let i = 0; i < 7; i++) step(w);
  expect(w.result).toEqual({ winner: null, reason: 'conquest' });
});
it('stop cancels an unreleased windup without resetting the attack interval', () => {
  const { w, attacker, target } = duel('archer', 'villager', 5000); step(w);
  command(w, 0, { type: 'stop', ids: [attacker.id] });
  for (let i = 0; i < 20; i++) step(w);
  expect(target.hp).toBe(30); expect(attacker.cooldown).toBeGreaterThan(0);
});
it('counts actual contained passengers for conquest and removes them on container destruction', () => {
  const w = createMatch(); w.entities = {};
  const house = spawn(w, 0, 'building', 'house', 20000, 20000), passenger = spawn(w, 0, 'unit', 'villager', 20000, 20000);
  passenger.container = house.id; house.passengers = [passenger.id];
  const attacker = spawn(w, 1, 'unit', 'militia', 22000, 20000); step(w); expect(w.result).toBeNull();
  house.hp = 1; command(w, 1, { type: 'attack', ids: [attacker.id], target: house.id });
  for (let i = 0; i < 40; i++) step(w);
  expect(w.entities[passenger.id]).toBeUndefined(); expect(w.result?.winner).toBe(1);
});
it('keeps a player with completed production capability alive without units', () => {
  const w = createMatch(); w.entities = {};
  spawn(w, 0, 'building', 'barracks', 20000, 20000); spawn(w, 1, 'unit', 'villager', 40000, 40000);
  step(w); expect(w.result).toBeNull();
});
it('applies foundation building armor exactly', () => {
  const w = createMatch(); w.entities = {}; const a = spawn(w, 0, 'unit', 'militia', 20000, 20000);
  const b = spawn(w, 1, 'building', 'house', 22000, 20000); spawn(w, 1, 'unit', 'villager', 50000, 50000);
  command(w, 0, { type: 'attack', ids: [a.id], target: b.id }); for (let i = 0; i < 7; i++) step(w);
  expect(b.hp).toBe(445);
});
