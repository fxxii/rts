import { expect, it } from 'vitest';
import { createMatch, command, step } from '../src/sim/index.js';
import { applyInputs } from '../src/sim/inputs.js';
import { checkpoint, replay } from '../src/sim/replay.js';
it('arbitrates same-tick expiries as a draw in either arrival order and replays them', () => {
  const a = createMatch(11), b = createMatch(11);
  applyInputs(a, [], [0, 1]); applyInputs(b, [], [1, 0]);
  expect(a.result).toEqual({ winner: null, reason: 'disconnect' });
  expect(checkpoint(a)).toBe(checkpoint(b));
  expect(checkpoint(replay(a.seed, a.log, a.tick))).toBe(checkpoint(a));
});
it('records a single expired seat and replays terminal commands on the final tick boundary', () => {
  const w = createMatch(); step(w);
  applyInputs(w, [], [1]);
  expect(w.result).toEqual({ winner: 0, reason: 'disconnect' });
  expect(checkpoint(replay(w.seed, w.log, w.tick))).toBe(checkpoint(w));
  const resigned = createMatch(); step(resigned); command(resigned, 0, { type: 'resign' });
  expect(checkpoint(replay(resigned.seed, resigned.log, resigned.tick))).toBe(checkpoint(resigned));
});
it('sorts queued gameplay by player and sequence independently of delivery order', () => {
  const a = createMatch(), b = createMatch();
  const tc = Object.values(a.entities).find(e => e.owner === 0 && e.def === 'townCenter')!;
  const first = { player: 0 as const, seq: 1, command: { type: 'train' as const, building: tc.id, def: 'villager' } };
  const second = { player: 0 as const, seq: 2, command: { type: 'cancel' as const, building: tc.id, index: 0 } };
  applyInputs(a, [second, first], []); applyInputs(b, [first, second], []);
  expect(checkpoint(a)).toBe(checkpoint(b)); expect(a.players[0].resources.food).toBe(200);
});
