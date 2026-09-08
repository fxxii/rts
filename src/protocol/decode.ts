import type { Command } from './types.js';
const integer = (v: unknown, min: number, max: number): v is number => typeof v === 'number' && Number.isSafeInteger(v) && v >= min && v <= max;
export function decodeCommand(value: unknown): Command | undefined {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return;
  const v = value as Record<string, unknown>;
  if (typeof v.type !== 'string') return;
  if (v.type === 'resign') return { type: 'resign' };
  const ids = Array.isArray(v.ids) && v.ids.length > 0 && v.ids.length <= 200 && v.ids.every(id => integer(id, 1, 1e9)) ? [...new Set(v.ids as number[])] : undefined;
  const queued = v.queued === true;
  if (v.queued !== undefined && typeof v.queued !== 'boolean') return;
  const q = queued ? { queued: true } : {};
  if (v.type === 'stop' || v.type === 'hold') return ids ? { type: v.type, ids } : undefined;
  if (v.type === 'move' || v.type === 'attackMove' || v.type === 'patrol' || v.type === 'build') {
    if (!ids || !integer(v.x, 0, 64000) || !integer(v.z, 0, 64000)) return;
    if (v.type === 'build') return typeof v.def === 'string' && v.def.length <= 40 ? { type: 'build', ids, x: v.x, z: v.z, def: v.def, ...q } : undefined;
    return { type: v.type, ids, x: v.x, z: v.z, ...q };
  }
  if (['gather', 'attack', 'repair', 'assist', 'deposit'].includes(v.type)) {
    if (!ids || !integer(v.target, 1, 1e9)) return;
    return { type: v.type as 'gather' | 'attack' | 'repair' | 'assist' | 'deposit', ids, target: v.target, ...q };
  }
  if (!integer(v.building, 1, 1e9)) return;
  if (v.type === 'train' || v.type === 'research') return typeof v.def === 'string' && v.def.length <= 40 ? { type: v.type, building: v.building, def: v.def } : undefined;
  if (v.type === 'cancel') return integer(v.index, -1, 31) ? { type: 'cancel', building: v.building, index: v.index } : undefined;
  if (v.type === 'rally' && integer(v.x, 0, 64000) && integer(v.z, 0, 64000)) return { type: 'rally', building: v.building, x: v.x, z: v.z };
}
