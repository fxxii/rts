import { expect, it } from 'vitest';
import { createMatch, command } from '../src/sim/index.js';
import { checkpoint } from '../src/sim/replay.js';
it('inherited object property names cannot act as content definitions', () => {
  const world = createMatch(), worker = Object.values(world.entities).find(e => e.owner === 0 && e.def === 'villager')!;
  const before = checkpoint(world);
  for (const def of ['__proto__', 'constructor', 'toString', 'hasOwnProperty']) {
    expect(command(world, 0, { type: 'build', ids: [worker.id], def, x: 14000, z: 10000 }).ok).toBe(false);
  }
  expect(checkpoint(world)).toBe(before);
});
