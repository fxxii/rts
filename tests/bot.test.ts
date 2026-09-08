import { expect, it } from 'vitest';
import { createMatch, observe, step } from '../src/sim/index.js';
import { spawn } from '../src/sim/world.js';
import { createBotMemory, decide } from '../src/bot/index.js';
import { decodeCommand } from '../src/protocol/decode.js';
it('keeps commanding its surviving army after losing its Town Center', () => {
  const w = createMatch(), memory = createBotMemory(); decide(observe(w, 0), memory);
  for (const e of Object.values(w.entities)) if (e.owner === 0 && e.def === 'townCenter') delete w.entities[e.id];
  for (let i = 0; i < 5; i++) spawn(w, 0, 'unit', 'militia', 14000 + i * 1000, 12000);
  step(w);
  const commands = decide(observe(w, 0), memory);
  expect(commands.some(c => c.type === 'attackMove')).toBe(true);
  expect(commands.every(c => decodeCommand(c))).toBe(true);
});
