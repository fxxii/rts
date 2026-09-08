import type { Command, PlayerView, ViewEntity, Point } from '../protocol/types.js';
import { CONTENT } from '../content/catalog.js';
export interface BotMemory { last: Record<number, number>; buildAttempt: number; lastBuild: number; home?: Point; scouting: number }
export const createBotMemory = (): BotMemory => ({ last: {}, buildAttempt: 0, lastBuild: -1000, scouting: 0 });
export function decide(view: PlayerView, memory: BotMemory): Command[] {
  if (view.result) return [];
  const own = view.entities.filter(e => e.owner === view.player), workers = own.filter(e => e.def === 'villager'), buildings = own.filter(e => e.kind === 'building');
  const commands: Command[] = [], tc = buildings.find(e => e.def === 'townCenter');
  if (tc) memory.home = { x: tc.x, z: tc.z };
  const home = memory.home ?? own[0]; if (!home) return [];
  const idle = workers.filter(e => e.activity === 'idle' && view.tick - (memory.last[e.id] ?? -1000) > 40);
  for (const [i, worker] of idle.entries()) {
    const index = workers.findIndex(e => e.id === worker.id), resource = index % 4 === 0 ? 'wood' : index % 4 === 1 ? 'gold' : 'food';
    const source = view.entities.filter(e => e.kind === 'resource' && e.visible && e.resource === resource && (e.amount ?? 0) > 0)
      .sort((a, b) => Math.hypot(a.x - worker.x, a.z - worker.z) - Math.hypot(b.x - worker.x, b.z - worker.z))[0];
    if (source && i < 10) { commands.push({ type: 'gather', ids: [worker.id], target: source.id }); memory.last[worker.id] = view.tick; }
  }
  if (tc && workers.length < 14 && !tc.queue?.length && view.resources.food >= 50) commands.push({ type: 'train', building: tc.id, def: 'villager' });
  const needed = !tc ? 'townCenter' : view.population >= view.capacity - 2 ? 'house' : !buildings.some(e => e.def === 'barracks') ? 'barracks' : !buildings.some(e => e.def === 'archeryRange') ? 'archeryRange' : undefined;
  if (needed && workers.length && view.tick - memory.lastBuild > 80 && Object.entries(CONTENT.buildings[needed].cost).every(([r, n]) => view.resources[r as keyof typeof view.resources] >= n) && !buildings.some(e => e.def === needed && (e.progress ?? 1) < 1)) {
    const visible = new Set(view.visible), size = CONTENT.buildings[needed].size;
    for (let attempt = 0; attempt < 81; attempt++) {
      const n = memory.buildAttempt++ % 81;
      const point = { x: home.x + (n % 9 - 4) * 4000, z: home.z + (Math.floor(n / 9) - 4) * 4000 };
      if (point.x < 2000 || point.z < 2000 || point.x > (view.width - 3) * 1000 || point.z > (view.height - 3) * 1000) continue;
      let explored = true;
      for (let dx = -2; dx <= 2; dx++) for (let dz = -2; dz <= 2; dz++) if (!visible.has(Math.floor(point.x / 1000) + dx + (Math.floor(point.z / 1000) + dz) * view.width)) explored = false;
      if (!explored || view.entities.some(e => Math.abs(e.x - point.x) < (size + (e.kind === 'building' ? CONTENT.buildings[e.def]?.size ?? 2 : 1)) * 500 + 500 && Math.abs(e.z - point.z) < (size + (e.kind === 'building' ? CONTENT.buildings[e.def]?.size ?? 2 : 1)) * 500 + 500)) continue;
      const builder = [...workers].filter(w => w.activity !== 'assist').sort((a, b) => (a.carried ?? 0) - (b.carried ?? 0) || Math.hypot(a.x - point.x, a.z - point.z) - Math.hypot(b.x - point.x, b.z - point.z))[0];
      if (builder) commands.push({ type: 'build', ids: [builder.id], def: needed, ...point });
      break;
    }
    memory.lastBuild = view.tick;
  }
  for (const b of buildings) if ((b.progress ?? 1) === 1 && !b.queue?.length) {
    if (b.def === 'barracks' && view.resources.food >= 60 && view.resources.gold >= 20) commands.push({ type: 'train', building: b.id, def: 'militia' });
    if (b.def === 'archeryRange' && view.resources.wood >= 25 && view.resources.gold >= 45) commands.push({ type: 'train', building: b.id, def: 'archer' });
  }
  const soldiers = own.filter(e => e.kind === 'unit' && e.def !== 'villager');
  const target: ViewEntity | undefined = view.entities.filter(e => e.owner !== view.player && e.owner !== -1).sort((a, b) => Number(b.visible) - Number(a.visible) || Number(b.kind === 'building') - Number(a.kind === 'building') || a.id - b.id)[0];
  const waypoints = [[1, 1], [1, 3], [3, 3], [3, 1], [2, 2]];
  for (const u of soldiers) if ((u.def === 'scout' || soldiers.length >= 5 || !tc || view.resources.food < 60) && view.tick - (memory.last[u.id] ?? -1000) > 400 && (u.activity === 'idle' || !!target)) {
    const point = target ?? (view.tick < 3000 ? { x: (view.width - 1) * 1000 - home.x, z: (view.height - 1) * 1000 - home.z } : { x: waypoints[memory.scouting++ % waypoints.length][0] * view.width * 250, z: waypoints[(memory.scouting - 1) % waypoints.length][1] * view.height * 250 });
    commands.push({ type: 'attackMove', ids: [u.id], x: point.x, z: point.z }); memory.last[u.id] = view.tick;
  }
  return commands.slice(0, 20);
}
