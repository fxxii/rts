import { CONTENT } from '../content/catalog.js';
import type { PlayerId, PlayerView, ViewEntity } from '../protocol/types.js';
import type { Entity, World } from './types.js';
import { cell } from './navigation.js';
import { capacity, population } from './world.js';
export function updateVisibility(w: World): void {
  for (const p of [0, 1] as const) {
    const visible = new Set<number>();
    for (const e of Object.values(w.entities)) {
      if (e.owner !== p || e.hp <= 0 || e.container) continue;
      const sight = (e.kind === 'unit' ? CONTENT.units[e.def]?.sight : CONTENT.buildings[e.def]?.sight) ?? 5000;
      const r = Math.ceil(sight / 1000), cx = Math.floor(e.x / 1000), cz = Math.floor(e.z / 1000);
      for (let dz = -r; dz <= r; dz++) for (let dx = -r; dx <= r; dx++) {
        const x = cx + dx, z = cz + dz;
        if (x >= 0 && z >= 0 && x < w.width && z < w.height && dx * dx + dz * dz <= r * r) visible.add(x + z * w.width);
      }
    }
    const player = w.players[p]; player.visible = [...visible].sort((a, b) => a - b);
    player.explored = [...new Set([...player.explored, ...player.visible])].sort((a, b) => a - b);
    for (const [id, memory] of Object.entries(player.memory)) if (visible.has(cell(w, memory)) && !w.entities[Number(id)]) delete player.memory[Number(id)];
    for (const e of Object.values(w.entities)) if (e.hp > 0 && !e.container && (e.owner === p || visible.has(cell(w, e)))) {
      if (!player.refs[e.id]) player.refs[e.id] = player.nextRef++;
      if (e.kind === 'building' && e.owner !== p) player.memory[e.id] = viewEntity(w, p, e, true);
    }
    const retained = new Set(w.events.map(e => e.id));
    // Map events once in simulation order, never according to observer polling.
    // Filtering uses event-time visibility, so rescout cannot reveal old hidden effects.
    for (const event of w.events) if (event.id > player.eventCursor) {
      if (visible.has(cell(w, event)) || (event.owner === p && event.name.startsWith('alerts.'))) {
        player.events.push({ ...event, id: player.nextEventRef++, entity: event.entity ? player.refs[event.entity] : undefined });
      }
      player.eventCursor = event.id;
    }
    if (!retained.size) player.events = [];
  }
}
export function canSee(w: World, p: PlayerId, e: Entity): boolean {
  if (e.container) return false;
  if (e.owner === p) return true;
  // updateVisibility owns this sorted array; binary search avoids a linear fog scan per candidate.
  const cells = w.players[p].visible, target = cell(w, e);
  let low = 0, high = cells.length - 1;
  while (low <= high) {
    const mid = (low + high) >>> 1, value = cells[mid];
    if (value === target) return true;
    if (value < target) low = mid + 1; else high = mid - 1;
  }
  return false;
}
function viewEntity(w: World, p: PlayerId, e: Entity, visible: boolean): ViewEntity {
  const v: ViewEntity = { id: w.players[p].refs[e.id], owner: e.owner, kind: e.kind, def: e.def, x: e.x, z: e.z, hp: e.hp, maxHp: e.maxHp, visible };
  if (e.kind === 'resource') { v.resource = e.resource; v.amount = e.amount; }
  if (e.kind === 'building') v.progress = e.progress / Math.max(1, e.buildTotal);
  if (e.owner === p) {
    v.activity = e.order?.type ?? 'idle'; v.carried = e.carry; v.cargo = e.cargo;
    if (e.kind === 'building') { v.queue = e.queue.map(q => ({ def: q.def, remaining: q.remaining, total: q.total, blocked: q.blocked })); v.rally = e.rally; }
  } else if (visible && e.order) v.activity = e.order.type;
  return v;
}
export function observe(w: World, p: PlayerId): PlayerView {
  const player = w.players[p], entities: ViewEntity[] = [], current = new Set<number>();
  for (const e of Object.values(w.entities)) if (e.hp > 0 && !e.container && canSee(w, p, e)) {
    entities.push(viewEntity(w, p, e, true)); current.add(e.id);
  }
  for (const [id, v] of Object.entries(player.memory)) if (!current.has(Number(id))) entities.push({ ...v, visible: false });
  return { tick: w.tick, player: p, width: w.width, height: w.height, resources: { ...player.resources }, population: population(w, p), capacity: capacity(w, p), age: player.age,
    researched: [...player.researched], entities, visible: [...player.visible], explored: [...player.explored], result: w.result ? { ...w.result } : null,
    events: player.events.map(e => ({ ...e })) };
}
export function resolveRef(w: World, p: PlayerId, ref: number): number | undefined { const found = Object.entries(w.players[p].refs).find(([, value]) => value === ref); return found ? Number(found[0]) : undefined; }
