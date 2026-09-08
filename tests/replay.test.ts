import { expect, it } from 'vitest';
import { createMatch, command, step } from '../src/sim/index.js';
import { checkpoint, replay } from '../src/sim/replay.js';
it('replays assigned command ticks to identical complete-state hashes', () => {
  const w = createMatch(42); const id = Object.values(w.entities).find(e => e.owner === 0 && e.def === 'villager')!.id;
  for (let i = 0; i < 80; i++) { if (i === 10) command(w, 0, { type: 'move', ids: [id], x: 14000, z: 10000 }); step(w); }
  expect(checkpoint(replay(42, w.log, 80))).toBe(checkpoint(w));
  expect(checkpoint(replay(43, w.log, 80))).not.toBe(checkpoint(w));
});

import { observe } from '../src/sim/index.js';
it('replay is independent of observer polling frequency during construction and gathering', () => {
  const w = createMatch(17); const v = Object.values(w.entities).find(e => e.owner === 0 && e.def === 'villager')!;
  for (let i = 0; i < 240; i++) {
    if (i === 0) command(w, 0, { type: 'build', ids: [v.id], def: 'house', x: 14000, z: 10000 });
    if (i === 130) { const source = Object.values(w.entities).find(e => e.resource === 'food')!; command(w, 0, { type: 'gather', ids: [v.id], target: source.id }); }
    observe(w, 0); if (i % 7 === 0) observe(w, 1); step(w);
  }
  expect(checkpoint(replay(17, w.log, 240))).toBe(checkpoint(w));
});
it('rejected unaffordable construction does not perturb replay state or route budgets', () => {
  const w = createMatch(); const v = Object.values(w.entities).find(e => e.owner === 0 && e.def === 'villager')!;
  w.players[0].resources.wood = 0; const before = checkpoint(w);
  expect(command(w, 0, { type: 'build', ids: [v.id], def: 'house', x: 14000, z: 10000 }).ok).toBe(false);
  expect(checkpoint(w)).toBe(before);
});
