import { parentPort, workerData } from 'node:worker_threads';
import { createMatch, observe, step } from '../sim/index.js';
import { applyInputs, type QueuedInput } from '../sim/inputs.js';
import { checkpoint } from '../sim/replay.js';
import { resolveRef } from '../sim/visibility.js';
import { createBotMemory, decide } from '../bot/index.js';
import type { Command, PlayerId } from '../protocol/types.js';
const port = parentPort!;
const data = workerData as { seed: number; practice: boolean };
const world = createMatch(data.seed), bot = createBotMemory();
const checkpoints = [{ tick: 0, hash: checkpoint(world) }];
let announced = false;
let pending: QueuedInput[] = [], expired: PlayerId[] = [], snapshotRequested = false;
function translate(p: PlayerId, input: Command): Command {
  const c = structuredClone(input);
  if ('ids' in c) c.ids = c.ids.map(id => resolveRef(world, p, id) ?? -1);
  if ('target' in c) c.target = resolveRef(world, p, c.target) ?? -1;
  if ('building' in c) c.building = resolveRef(world, p, c.building) ?? -1;
  return c;
}
function publish() { port.postMessage({ type: 'views', views: [observe(world, 0), observe(world, 1)] }); }
port.on('message', (m: { type: string; player: PlayerId; seq: number; command: Command }) => {
  if (m.type === 'command') pending.push({ player: m.player, seq: m.seq, command: translate(m.player, m.command) });
  if (m.type === 'snapshot') snapshotRequested = true;
  if (m.type === 'forfeit') expired.push(m.player);
});
setInterval(() => {
  if (data.practice && !world.result && world.tick % 20 === 0) {
    decide(observe(world, 1), bot).forEach((c, seq) => pending.push({ player: 1, seq: -100 + seq, command: translate(1, c) }));
  }
  for (const response of applyInputs(world, pending, expired)) if (response.seq > 0) {
    port.postMessage({ type: 'ack', player: response.player, seq: response.seq, ok: response.ok, ...(!response.ok ? { reason: response.reason } : {}) });
  }
  pending = []; expired = [];
  if (!world.result) {
    step(world);
    if (world.tick % 200 === 0) checkpoints.push({ tick: world.tick, hash: checkpoint(world) });
    if (world.tick % 2 === 0) publish();
  }
  if (snapshotRequested) { snapshotRequested = false; publish(); }
  if (world.result && !announced) {
    announced = true; publish();
    port.postMessage({ type: 'finished', result: world.result, replay: { schemaVersion: 1, content: world.version, seed: world.seed, tickHz: 20, ticks: world.tick, inputs: world.log, checkpoints, finalHash: checkpoint(world) } });
  }
}, 50);
publish();
