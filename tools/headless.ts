import { performance } from 'node:perf_hooks';
import { createMatch, command, observe, step } from '../src/sim/index.js';
import { resolveRef } from '../src/sim/visibility.js';
import { checkpoint, replay } from '../src/sim/replay.js';
import { createBotMemory, decide } from '../src/bot/index.js';
import type { PlayerId } from '../src/protocol/types.js';

const seed = 42, world = createMatch(seed), memories = [createBotMemory(), createBotMemory()];
const samples: number[] = [], rejected: Record<string, number> = {};
const maxTicks = Number(process.argv[2] ?? 18000);
for (let n = 0; n < maxTicks && !world.result; n++) {
  const start = performance.now();
  if (world.tick % 20 === 0) for (const player of [0, 1] as PlayerId[]) {
    for (const input of decide(observe(world, player), memories[player])) {
      const c = structuredClone(input);
      if ('ids' in c) c.ids = c.ids.map(id => resolveRef(world, player, id) ?? -1);
      if ('target' in c) c.target = resolveRef(world, player, c.target) ?? -1;
      if ('building' in c) c.building = resolveRef(world, player, c.building) ?? -1;
      const result = command(world, player, c);
      if (!result.ok) rejected[result.reason] = (rejected[result.reason] ?? 0) + 1;
    }
  }
  step(world); samples.push(performance.now() - start);
}
samples.sort((a, b) => a - b);
const hash = checkpoint(world), repeatedHash = checkpoint(replay(seed, world.log, world.tick));
console.log(JSON.stringify({ seed, ticks: world.tick, result: world.result ?? 'unfinished', commands: world.log.length,
  rejected, hash, replayMatches: hash === repeatedHash,
  tickMs: { p50: samples[Math.floor(samples.length * .5)], p95: samples[Math.floor(samples.length * .95)], p99: samples[Math.floor(samples.length * .99)], max: samples.at(-1) },
  players: world.players.map((p, i) => ({ resources: p.resources, units: Object.values(world.entities).filter(e => e.owner === i && e.kind === 'unit').length, buildings: Object.values(world.entities).filter(e => e.owner === i && e.kind === 'building').map(e => e.def) }))
}, null, 2));
if (hash !== repeatedHash) process.exitCode = 1;
