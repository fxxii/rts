import { createHash } from 'node:crypto';
import type { ReplayInput, World } from './types.js';
import { command, createMatch, step } from './index.js';
import { applyInputs } from './inputs.js';
function canonical(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(canonical).join(',')}]`;
  if (value && typeof value === 'object') return `{${Object.entries(value).filter(([key, v]) => key !== 'log' && v !== undefined).sort(([a], [b]) => a.localeCompare(b, 'en')).map(([key, v]) => `${JSON.stringify(key)}:${canonical(v)}`).join(',')}}`;
  return JSON.stringify(value);
}
export function checkpoint(w: World): string { return createHash('sha256').update(canonical(w)).digest('hex'); }
export function replay(seed: number, entries: ReplayInput[], ticks: number): World {
  const w = createMatch(seed);
  const byTick = new Map<number, ReplayInput[]>();
  for (const entry of entries) { const batch = byTick.get(entry.tick) ?? []; batch.push(entry); byTick.set(entry.tick, batch); }
  for (let i = 0; i <= ticks; i++) {
    for (const entry of byTick.get(w.tick) ?? []) {
      if ('disconnect' in entry) applyInputs(w, [], entry.disconnect);
      else command(w, entry.player, entry.command);
    }
    if (w.result || i === ticks) break;
    step(w);
  }
  return w;
}
