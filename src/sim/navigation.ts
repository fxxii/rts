import { CONTENT } from '../content/catalog.js';
import type { Point } from '../protocol/types.js';
import type { Entity, World } from './types.js';
import { distance } from './world.js';
export const cell = (w: World, p: Point): number => Math.max(0, Math.min(w.width - 1, Math.floor(p.x / 1000))) + Math.max(0, Math.min(w.height - 1, Math.floor(p.z / 1000))) * w.width;
export function blocked(w: World, x: number, z: number, ignore?: number): boolean {
  if (x < 1 || z < 1 || x >= w.width - 1 || z >= w.height - 1) return true;
  for (const e of Object.values(w.entities)) {
    if (e.id === ignore || e.hp <= 0 || e.kind === 'unit') continue;
    const size = e.kind === 'building' ? CONTENT.buildings[e.def].size : 1;
    if (Math.abs(e.x / 1000 - x) < size / 2 && Math.abs(e.z / 1000 - z) < size / 2) return true;
  }
  return false;
}
export function footprintFree(w: World, def: string, p: Point): boolean {
  const d = CONTENT.buildings[def]; if (!d) return false;
  for (let dx = -Math.floor(d.size / 2); dx <= Math.floor(d.size / 2); dx++) for (let dz = -Math.floor(d.size / 2); dz <= Math.floor(d.size / 2); dz++) {
    const x = p.x / 1000 + dx, z = p.z / 1000 + dz;
    if (blocked(w, x, z) || Object.values(w.entities).some(e => e.kind === 'unit' && distance(e, { x: x * 1000, z: z * 1000 }) < 500)) return false;
  }
  return true;
}
export function openNear(w: World, p: Point, radius = 5, includeUnits = false): Point | undefined {
  const cx = Math.round(p.x / 1000), cz = Math.round(p.z / 1000);
  for (let r = 0; r <= radius; r++) for (let dz = -r; dz <= r; dz++) for (let dx = -r; dx <= r; dx++) {
    if (Math.max(Math.abs(dx), Math.abs(dz)) !== r) continue;
    const point = { x: (cx + dx) * 1000, z: (cz + dz) * 1000 };
    if (!blocked(w, cx + dx, cz + dz) && (!includeUnits || !Object.values(w.entities).some(e => e.kind === 'unit' && !e.container && distance(e, point) < 650))) return point;
  }
}
// Construction validation runs once per command, independently of incremental movement.
// The disposable obstacle grid and reverse BFS visit at most width * height cells.
export function canReachAny(w: World, builders: Point[], target: Point): boolean {
  const occupied = new Uint8Array(w.width * w.height);
  for (let z = 0; z < w.height; z++) for (let x = 0; x < w.width; x++) {
    if (x < 1 || z < 1 || x >= w.width - 1 || z >= w.height - 1) occupied[x + z * w.width] = 1;
  }
  for (const e of Object.values(w.entities)) {
    if (e.hp <= 0 || e.kind === 'unit') continue;
    const half = (e.kind === 'building' ? CONTENT.buildings[e.def].size : 1) / 2;
    const cx = e.x / 1000, cz = e.z / 1000;
    for (let z = Math.max(1, Math.ceil(cz - half)); z <= Math.min(w.height - 2, Math.floor(cz + half)); z++) {
      for (let x = Math.max(1, Math.ceil(cx - half)); x <= Math.min(w.width - 2, Math.floor(cx + half)); x++) {
        if (Math.abs(cx - x) < half && Math.abs(cz - z) < half) occupied[x + z * w.width] = 1;
      }
    }
  }
  const starts = new Set(builders.map(p => Math.round(p.x / 1000) + Math.round(p.z / 1000) * w.width));
  const tx = Math.round(target.x / 1000), tz = Math.round(target.z / 1000), goal = tx + tz * w.width;
  if (tx < 1 || tz < 1 || tx >= w.width - 1 || tz >= w.height - 1 || occupied[goal]) return false;
  const seen = new Uint8Array(occupied.length), queue = [goal]; seen[goal] = 1;
  for (let cursor = 0; cursor < queue.length; cursor++) {
    const id = queue[cursor]; if (starts.has(id)) return true;
    for (const next of [id - w.width, id - 1, id + 1, id + w.width]) {
      if (next < 0 || next >= occupied.length || occupied[next] || seen[next]) continue;
      seen[next] = 1; queue.push(next);
    }
  }
  return false;
}
export function route(w: World, from: Point, target: Point, range = 0): Point[] {
  const candidates: Point[] = [];
  const cx = Math.round(target.x / 1000), cz = Math.round(target.z / 1000);
  const targetBlocked = blocked(w, cx, cz);
  for (let r = 0; r <= 5 && !candidates.length; r++) for (let dz = -r; dz <= r; dz++) for (let dx = -r; dx <= r; dx++) {
    const point = { x: (cx + dx) * 1000, z: (cz + dz) * 1000 };
    if (Math.max(Math.abs(dx), Math.abs(dz)) === r && !blocked(w, cx + dx, cz + dz) && (!targetBlocked || !range || distance(point, target) <= range) && (!targetBlocked || !range || !Object.values(w.entities).some(u => u !== from && u.kind === 'unit' && u.hp > 0 && !u.container && distance(u, point) < 550))) candidates.push(point);
  }
  candidates.sort((a, b) => distance(from, a) - distance(from, b) || a.z - b.z || a.x - b.x);
  const goal = candidates[0]; if (!goal) return [];
  const sx = Math.round(from.x / 1000), sz = Math.round(from.z / 1000), gx = goal.x / 1000, gz = goal.z / 1000;
  if (sx === gx && sz === gz) {
    const endpoint = targetBlocked ? goal : target;
    return distance(from, endpoint) > 0 ? [{ ...endpoint }] : [];
  }
  const key = `${w.revision}:${sx},${sz}:${gx},${gz}`;
  if (w.routes[key]) return w.routes[key].map(p => ({ ...p }));
  const nav = w.navigation;
  if (nav.tick !== w.tick) { nav.tick = w.tick; nav.expanded = 0; }
  for (const stale of Object.keys(nav.searches)) if (!stale.startsWith(`${w.revision}:`)) delete nav.searches[stale];
  const start = sx + sz * w.width, end = gx + gz * w.width;
  if (!nav.searches[key] && Object.keys(nav.searches).length >= 512) return [];
  const search = nav.searches[key] ??= { start, end, open: [start], seen: {}, costs: { [start]: 0 }, previous: {} };
  const { open, seen, costs, previous } = search;
  const estimate = (id: number) => Math.abs(id % w.width - gx) + Math.abs(Math.floor(id / w.width) - gz);
  let slice = 0;
  while (open.length && nav.expanded < 512 && slice < 64) {
    open.sort((a, b) => (costs[a] + estimate(a)) - (costs[b] + estimate(b)) || a - b);
    const id = open.shift()!; if (seen[id]) continue; seen[id] = true; nav.expanded++; slice++;
    if (id === end) {
      const result: Point[] = []; let cursor = end;
      while (cursor !== start) { result.push({ x: (cursor % w.width) * 1000, z: Math.floor(cursor / w.width) * 1000 }); cursor = previous[cursor]; }
      result.reverse(); if (Object.keys(w.routes).length >= 1024) w.routes = {};
      w.routes[key] = result; delete nav.searches[key]; return result.map(p => ({ ...p }));
    }
    for (const [dx, dz] of [[0, -1], [-1, 0], [1, 0], [0, 1]]) {
      const x = id % w.width + dx, z = Math.floor(id / w.width) + dz, next = x + z * w.width;
      if (blocked(w, x, z) || seen[next]) continue;
      const cost = costs[id] + 1;
      if (cost < (costs[next] ?? Infinity)) { costs[next] = cost; previous[next] = id; open.push(next); }
    }
  }
  if (!open.length) { w.routes[key] = []; delete nav.searches[key]; }
  return [];
}
export function walk(w: World, e: Entity, target: Point, range = 100): boolean {
  if (distance(e, target) <= range) { e.path = []; e.stuck = 0; return true; }
  const targetKey = `${Math.round(target.x / 1000)},${Math.round(target.z / 1000)}`;
  if (e.routeTarget !== targetKey || e.routeRevision !== w.revision) { e.path = []; e.nextPathTick = 0; e.detour = undefined; e.routeTarget = targetKey; }
  if (!e.path.length && w.tick >= e.nextPathTick) {
    // Travel orders may end at an occupied destination perimeter; work/combat must reach their interaction radius.
    e.path = route(w, e, target, range > 120 ? range : 0); e.routeRevision = w.revision; e.nextPathTick = w.tick + 1;
    if (!e.path.length) { e.stuck++; e.nextPathTick = w.tick + (e.stuck > 100 ? 20 : 1); }
  }
  if (e.path.length > 1 && Object.values(w.entities).some(u => u.id !== e.id && u.kind === 'unit' && !u.container && distance(u, e.path[0]) < 550)) e.path.shift();
  if (e.detour && distance(e, e.detour) < 100) e.detour = undefined;
  const next = e.detour ?? e.path[0]; if (!next) return false;
  const d = distance(e, next), speed = CONTENT.units[e.def].speed;
  const candidate = d <= speed ? { ...next } : { x: e.x + Math.round((next.x - e.x) / d * speed), z: e.z + Math.round((next.z - e.z) / d * speed) };
  const free = (p: Point) => !blocked(w, Math.round(p.x / 1000), Math.round(p.z / 1000)) && !Object.values(w.entities).some(u => u.id !== e.id && u.kind === 'unit' && u.hp > 0 && !u.container && distance(u, p) < 550 && distance(u, p) < distance(u, e));
  if (free(candidate)) { e.x = candidate.x; e.z = candidate.z; e.stuck = 0; if (d <= speed) { if (e.detour) e.detour = undefined; else e.path.shift(); } }
  else {
    e.stuck++;
    // Deterministic bounded local steering. Each move remains within the unit's speed.
    const dx = candidate.x - e.x, dz = candidate.z - e.z;
    const side = e.id % 2 ? 1 : -1;
    const alternatives = [{ x: e.x - dz * side, z: e.z + dx * side }, { x: e.x + dz * side, z: e.z - dx * side }];
    const blocker = Object.values(w.entities).find(u => u.id !== e.id && u.kind === 'unit' && !u.container && distance(u, candidate) < 550);
    if (blocker && !e.detour) {
      const length = Math.max(1, Math.hypot(dx, dz));
      const detours = [side, -side].map(sign => ({ x: Math.round(blocker.x - dz / length * 800 * sign), z: Math.round(blocker.z + dx / length * 800 * sign) }));
      e.detour = detours.find(p => !blocked(w, Math.round(p.x / 1000), Math.round(p.z / 1000)) && free(p));
    }
    const alternative = alternatives.find(p => free(p) && !blocked(w, Math.round((e.x + (p.x - e.x) * 7) / 1000), Math.round((e.z + (p.z - e.z) * 7) / 1000))) ?? alternatives.find(free);
    if (alternative && e.stuck > 2) { e.x = alternative.x; e.z = alternative.z; }
    if (e.stuck >= 20) { e.path = []; e.detour = undefined; e.nextPathTick = w.tick + 5; e.stuck = 0; }
  }
  return distance(e, target) <= range;
}
