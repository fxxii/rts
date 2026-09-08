import { expect, it } from 'vitest';
import { createMatch, observe } from '../src/sim/index.js';
it('omits all unscouted enemy units and distant resource layouts', () => {
  const w = createMatch(), view = observe(w, 0);
  expect(view.entities.some(e => e.owner === 1)).toBe(false);
  expect(view.entities.filter(e => e.kind === 'resource').length).toBeLessThan(Object.values(w.entities).filter(e => e.kind === 'resource').length);
  expect(JSON.stringify(view)).not.toContain('seed');
});

import { command, step } from '../src/sim/index.js';
import { emit, spawn } from '../src/sim/world.js';
import { updateVisibility } from '../src/sim/visibility.js';
import { checkpoint } from '../src/sim/replay.js';
it('gives visible events stable contiguous private IDs despite hidden events', () => {
  const w = createMatch(); const own = Object.values(w.entities).find(e => e.owner === 0)!;
  const enemy = Object.values(w.entities).find(e => e.owner === 1)!;
  emit(w, 'test.hidden', enemy); emit(w, 'test.visible', own); updateVisibility(w);
  expect(observe(w, 0).events.map(e => e.id)).toEqual([1]);
  const hash = checkpoint(w); expect(observe(w, 0).events).toEqual(observe(w, 0).events); expect(checkpoint(w)).toBe(hash);
  emit(w, 'test.hidden', enemy); emit(w, 'test.visible', own); updateVisibility(w);
  expect(observe(w, 0).events.map(e => e.id)).toEqual([1, 2]);
});
it('retains last-seen buildings until rescout but never remembers moving units or resources', () => {
  const w = createMatch(); const scout = Object.values(w.entities).find(e => e.owner === 0 && e.def === 'scout')!;
  const enemy = spawn(w, 1, 'building', 'house', 30000, 30000);
  spawn(w, 1, 'unit', 'villager', 30000, 31000);
  const resource = spawn(w, -1, 'resource', 'gold', 31000, 30000); resource.resource = 'gold'; resource.amount = 100;
  scout.x = 29000; scout.z = 30000; updateVisibility(w);
  const ref = w.players[0].refs[enemy.id]; expect(observe(w, 0).entities.find(e => e.id === ref)?.visible).toBe(true);
  scout.x = 5000; scout.z = 10000; updateVisibility(w); delete w.entities[enemy.id]; updateVisibility(w);
  const hidden = observe(w, 0); expect(hidden.entities.find(e => e.id === ref)?.visible).toBe(false);
  expect(hidden.entities.some(e => e.owner === 1 && e.kind === 'unit')).toBe(false);
  expect(hidden.entities.some(e => e.id === w.players[0].refs[resource.id])).toBe(false);
  scout.x = 29000; scout.z = 30000; updateVisibility(w); expect(observe(w, 0).entities.some(e => e.id === ref)).toBe(false);
});
it('does not grant vision or visible events from a contained own unit', () => {
  const w = createMatch(); const own = Object.values(w.entities).find(e => e.owner === 0 && e.def === 'villager')!;
  own.x = 50000; own.z = 50000; own.container = 999; updateVisibility(w); emit(w, 'combat.sword_swing', own); updateVisibility(w);
  expect(observe(w, 0).events).toEqual([]);
  expect(observe(w, 0).entities.some(e => e.x === 50000)).toBe(false);
});
it('observations never change the canonical replay state', () => {
  const w = createMatch(); const v = Object.values(w.entities).find(e => e.owner === 0 && e.def === 'villager')!;
  command(w, 0, { type: 'build', ids: [v.id], def: 'house', x: 14000, z: 10000 });
  const hash = checkpoint(w); observe(w, 0); observe(w, 1); expect(checkpoint(w)).toBe(hash); step(w);
});

import { canSee } from '../src/sim/visibility.js';
it('visibility lookup preserves every cell membership across generated fog and containment', () => {
  const w = createMatch(42), target = Object.values(w.entities).find(e => e.owner === 1 && e.kind === 'unit')!;
  const visible = new Set(w.players[0].visible);
  for (let z = 0; z < w.height; z++) for (let x = 0; x < w.width; x++) {
    target.x = x * 1000; target.z = z * 1000;
    expect(canSee(w, 0, target)).toBe(visible.has(x + z * w.width));
  }
  target.owner = 0; expect(canSee(w, 0, target)).toBe(true);
  target.container = 999; expect(canSee(w, 0, target)).toBe(false);
});
