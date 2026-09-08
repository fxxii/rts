import { describe, it, expect } from 'vitest';
import { createMatch, command, step } from '../src/sim/index.js';
import type { World } from '../src/sim/types.js';
const advance = (w: World, n: number) => { for (let i = 0; i < n; i++) step(w); };
const own = (w: World, def: string) => Object.values(w.entities).find(e => e.owner === 0 && e.def === def)!;
describe('authoritative physical economy', () => {
  it('gathering fills cargo before crediting treasury, then deposits', () => {
    const w = createMatch(12), v = own(w, 'villager');
    const source = Object.values(w.entities).find(e => e.resource === 'food')!;
    v.x = source.x - 1000; v.z = source.z;
    const before = w.players[0].resources.food;
    expect(command(w, 0, { type: 'gather', ids: [v.id], target: source.id }).ok).toBe(true);
    advance(w, 40);
    expect(v.carry).toBeGreaterThan(0); expect(w.players[0].resources.food).toBe(before);
    advance(w, 700); expect(w.players[0].resources.food).toBeGreaterThan(before);
  });
  it('charges queues once, prevents double spending and refunds once', () => {
    const w = createMatch(), tc = own(w, 'townCenter'); w.players[0].resources.food = 50;
    expect(command(w, 0, { type: 'train', building: tc.id, def: 'villager' }).ok).toBe(true);
    expect(command(w, 0, { type: 'train', building: tc.id, def: 'villager' })).toEqual({ ok: false, reason: 'resources' });
    expect(w.players[0].resources.food).toBe(0);
    expect(command(w, 0, { type: 'cancel', building: tc.id, index: 0 }).ok).toBe(true);
    command(w, 0, { type: 'cancel', building: tc.id, index: 0 });
    expect(w.players[0].resources.food).toBe(50);
  });
  it('rejects overlapping construction without spending', () => {
    const w = createMatch(), v = own(w, 'villager'), tc = own(w, 'townCenter');
    const before = w.players[0].resources.wood;
    expect(command(w, 0, { type: 'build', ids: [v.id], def: 'house', x: tc.x, z: tc.z }).ok).toBe(false);
    expect(w.players[0].resources.wood).toBe(before);
  });
  it('requires physical building work and applies a partial foundation refund', () => {
    const w = createMatch(), v = own(w, 'villager');
    const before = w.players[0].resources.wood;
    expect(command(w, 0, { type: 'build', ids: [v.id], def: 'house', x: 14000, z: 10000 }).ok).toBe(true);
    const house = own(w, 'house'); expect(house.progress).toBe(0);
    advance(w, 120); expect(house.progress).toBeGreaterThan(0); expect(house.progress).toBeLessThan(house.buildTotal);
    command(w, 0, { type: 'cancel', building: house.id, index: -1 });
    expect(w.entities[house.id]).toBeUndefined();
    expect(w.players[0].resources.wood).toBeGreaterThan(before - 25); expect(w.players[0].resources.wood).toBeLessThan(before);
  });
  it('rejects research without age requirements and pays for age advancement', () => {
    const w = createMatch(), tc = own(w, 'townCenter');
    expect(command(w, 0, { type: 'research', building: tc.id, def: 'castle' })).toEqual({ ok: false, reason: 'prerequisite' });
    w.players[0].resources.food = 500;
    expect(command(w, 0, { type: 'research', building: tc.id, def: 'feudal' }).ok).toBe(true);
    expect(w.players[0].resources.food).toBe(0); advance(w, 600);
    expect(w.players[0].age).toBe(1);
  });
});

import { spawn } from '../src/sim/world.js';
it('retains depleted source resource identity after deposit', () => {
  const w = createMatch(), v = own(w, 'villager');
  const food = Object.values(w.entities).find(e => e.resource === 'food')!;
  food.amount = 1; v.x = food.x - 1000; v.z = food.z;
  const other = spawn(w, -1, 'resource', 'food', 14000, 8000); other.resource = 'food'; other.amount = 100;
  const closer = spawn(w, -1, 'resource', 'wood', 11000, 7000); closer.resource = 'wood'; closer.amount = 100;
  command(w, 0, { type: 'gather', ids: [v.id], target: food.id }); advance(w, 180);
  expect(other.amount).toBeLessThan(100); expect(closer.amount).toBe(100);
});
it('switches its route immediately when loaded workers turn toward a dropoff', () => {
  const w = createMatch(), v = own(w, 'villager'), tc = own(w, 'townCenter');
  const food = Object.values(w.entities).find(e => e.resource === 'food')!;
  v.x = 16000; v.z = 8000;
  command(w, 0, { type: 'gather', ids: [v.id], target: food.id }); step(w);
  v.carry = 10; v.cargo = 'food'; delete w.entities[tc.id]; w.revision++;
  spawn(w, 0, 'building', 'mill', 18000, 8000);
  const x = v.x; step(w); expect(v.x).toBeGreaterThan(x);
});
it('holds completed population-blocked production and refunds it exactly once', () => {
  const w = createMatch(), tc = own(w, 'townCenter');
  for (let i = 0; i < 6; i++) spawn(w, 0, 'unit', 'villager', 20000 + i * 1000, 10000);
  command(w, 0, { type: 'train', building: tc.id, def: 'villager' }); advance(w, 220);
  expect(tc.queue[0]?.remaining).toBe(0); expect(tc.queue[0]?.blocked).toContain('Population');
  const paid = w.players[0].resources.food;
  command(w, 0, { type: 'cancel', building: tc.id, index: 0 }); command(w, 0, { type: 'cancel', building: tc.id, index: 0 });
  expect(w.players[0].resources.food).toBe(paid + 50);
});
it('holds spawn-blocked production until space opens without charging twice', () => {
  const w = createMatch(), tc = own(w, 'townCenter');
  const blocks = [];
  for (let x = 4; x <= 12; x++) for (let z = 4; z <= 12; z++) blocks.push(spawn(w, -1, 'resource', 'wood', x * 1000, z * 1000));
  command(w, 0, { type: 'train', building: tc.id, def: 'villager' }); const paid = w.players[0].resources.food; advance(w, 210);
  expect(tc.queue[0]?.blocked).toContain('Spawn');
  for (const b of blocks) delete w.entities[b.id]; w.revision++; advance(w, 1);
  expect(tc.queue).toHaveLength(0); expect(w.players[0].resources.food).toBe(paid);
});
it('recovers from an unreachable nearest dropoff without losing cargo', () => {
  const w = createMatch(); w.entities = {};
  const v = spawn(w, 0, 'unit', 'villager', 20000, 20000); spawn(w, 1, 'unit', 'villager', 60000, 60000);
  const near = spawn(w, 0, 'building', 'mill', 24000, 20000); spawn(w, 0, 'building', 'mill', 12000, 20000);
  for (let x = 22; x <= 26; x++) for (let z = 18; z <= 22; z++) if (x === 22 || x === 26 || z === 18 || z === 22) spawn(w, -1, 'resource', 'wood', x * 1000, z * 1000);
  w.revision++; v.carry = 10; v.cargo = 'food'; const before = w.players[0].resources.food;
  expect(command(w, 0, { type: 'deposit', ids: [v.id], target: near.id }).ok).toBe(true); advance(w, 450);
  expect(v.carry).toBe(0); expect(w.players[0].resources.food).toBe(before + 10);
});
it('production building destruction refunds none of its queue payment', () => {
  const w = createMatch(), tc = own(w, 'townCenter');
  command(w, 0, { type: 'train', building: tc.id, def: 'villager' }); tc.hp = 1;
  const attacker = spawn(w, 1, 'unit', 'militia', tc.x + 2000, tc.z);
  command(w, 1, { type: 'attack', ids: [attacker.id], target: tc.id }); const before = { ...w.players[0].resources }; advance(w, 7);
  expect(w.entities[tc.id]).toBeUndefined(); expect(w.players[0].resources).toEqual(before);
  expect(Object.values(w.players[0].resources).every(n => n >= 0)).toBe(true);
});
it('foundation destruction returns none of its paid construction cost', () => {
  const w = createMatch(), v = own(w, 'villager');
  expect(command(w, 0, { type: 'build', ids: [v.id], def: 'house', x: 14000, z: 10000 }).ok).toBe(true);
  const house = own(w, 'house'); command(w, 0, { type: 'stop', ids: [v.id] });
  const enemy = spawn(w, 1, 'unit', 'militia', 16000, 10000);
  command(w, 1, { type: 'attack', ids: [enemy.id], target: house.id }); const before = { ...w.players[0].resources }; advance(w, 7);
  expect(w.entities[house.id]).toBeUndefined(); expect(w.players[0].resources).toEqual(before);
});
it('seeded workers approach interaction range instead of stalling at diagonal resource and dropoff corners', () => {
  const w = createMatch(42);
  const workers = Object.values(w.entities).filter(e => e.owner === 0 && e.def === 'villager');
  const before = { ...w.players[0].resources };
  for (const [i, resource] of (['wood', 'gold', 'food'] as const).entries()) {
    const source = Object.values(w.entities).find(e => e.resource === resource)!;
    expect(command(w, 0, { type: 'gather', ids: [workers[i].id], target: source.id }).ok).toBe(true);
  }
  advance(w, 1200);
  for (const resource of ['wood', 'gold', 'food'] as const) expect(w.players[0].resources[resource]).toBeGreaterThan(before[resource] + 10);
});
it('finishes a sub-cell approach when rounded route start already equals the valid goal', () => {
  const w = createMatch(42), v = own(w, 'villager');
  const food = Object.values(w.entities).find(e => e.resource === 'food')!;
  v.x = food.x; v.z = food.z + 1280;
  command(w, 0, { type: 'gather', ids: [v.id], target: food.id }); advance(w, 25);
  expect(v.carry).toBeGreaterThan(0);
});
it('three seeded workers continue multiple deposit trips to one crowded food source', () => {
  const w = createMatch(42), workers = Object.values(w.entities).filter(e => e.owner === 0 && e.def === 'villager');
  const source = Object.values(w.entities).find(e => e.resource === 'food')!, before = w.players[0].resources.food;
  for (const worker of workers) command(w, 0, { type: 'gather', ids: [worker.id], target: source.id });
  advance(w, 1500); expect(w.players[0].resources.food).toBeGreaterThanOrEqual(before + 100);
});
it('uses another town-center approach when idle workers occupy the nearest deposit slot', () => {
  const w = createMatch(42); w.entities = {};
  const tc = spawn(w, 0, 'building', 'townCenter', 8000, 8000), v = spawn(w, 0, 'unit', 'villager', 12000, 8000);
  spawn(w, 1, 'unit', 'villager', 60000, 60000);
  for (const [x, z] of [[10000, 8000], [10350, 8500], [10350, 7500]]) spawn(w, 0, 'unit', 'villager', x, z);
  v.carry = 10; v.cargo = 'food'; const before = w.players[0].resources.food;
  command(w, 0, { type: 'deposit', ids: [v.id], target: tc.id }); step(w);
  expect(v.z).toBeLessThan(8000); advance(w, 400);
  expect(v.carry).toBe(0); expect(w.players[0].resources.food).toBe(before + 10);
});
