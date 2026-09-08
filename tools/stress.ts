import { performance } from 'node:perf_hooks';
import { cpus, totalmem, platform, release, arch } from 'node:os';
import { writeFile } from 'node:fs/promises';
import { createMatch, command, step, observe } from '../src/sim/index.js';
import { spawn, population } from '../src/sim/world.js';
const world = createMatch(42);
for (const e of Object.values(world.entities)) if (e.kind === 'unit') delete world.entities[e.id];
for (const p of [0, 1] as const) {
  const ids: number[] = [];
  for (let i = 0; i < 200; i++) {
    const e = spawn(world, p, 'unit', i % 4 === 0 ? 'archer' : i % 4 === 1 ? 'spearman' : 'militia', (p ? 42000 : 12000) + (i % 10) * 700, 18000 + Math.floor(i / 10) * 700);
    ids.push(e.id);
  }
  command(world, p, { type: 'attackMove', ids, x: p ? 15000 : 45000, z: 25000 });
}
const initialPopulation = [population(world, 0), population(world, 1)], samples: number[] = [], active: number[] = [];
for (let i = 0; i < 600; i++) {
  const start = performance.now(); step(world);
  if (i % 2 === 0) { observe(world, 0); observe(world, 1); }
  samples.push(performance.now() - start); active.push(Object.values(world.entities).filter(e => e.kind === 'unit').length);
}
samples.sort((a, b) => a - b);
const result = { recordedAt: new Date().toISOString(), fixture: '400-unit converging armies; original map; 50% swordsmen, 25% archers, 25% spearmen; 600 ticks including permitted observations every two ticks',
  seed: 42, content: world.version, initialPopulation, activeUnits: { initial: 400, minimum: Math.min(...active), final: active.at(-1) },
  machine: { cpu: cpus()[0].model, logicalCores: cpus().length, ramGiB: totalmem() / 1024 ** 3, platform: platform(), release: release(), arch: arch(), node: process.version },
  tickMs: { p50: samples[300], p95: samples[570], p99: samples[594], max: samples.at(-1), samples: samples.length, over50ms: samples.filter(t => t > 50).length },
  limitations: ['Headless local fixture, not a frame-rate benchmark or long-session proof.', 'Units seeded for load, not produced through economy.', 'No renderer, browser, audio or network latency in this run.', 'M1 Pro 16GB differs from proposed M1 Air 8GB target.'] };
await writeFile('docs/evidence/performance.json', JSON.stringify(result, null, 2) + '\n'); console.log(JSON.stringify(result, null, 2));
