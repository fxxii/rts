import { readFileSync, existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { resolve, sep } from 'node:path';
import { CONTENT } from '../src/content/catalog.js';
import { validateContent } from '../src/content/validate.js';
const root = resolve('plan/ironvale_design_pack/audio');
const manifest = JSON.parse(readFileSync(resolve(root, 'manifest.json'), 'utf8')) as {
  assets: { id: string; wav: string; ogg: string; sha256_wav: string; sha256_ogg: string }[];
  events: Record<string, { variants: string[] }>;
};
const errors = validateContent(CONTENT), ids = new Set<string>();
for (const a of manifest.assets) {
  if (ids.has(a.id)) errors.push(`Duplicate asset: ${a.id}`); ids.add(a.id);
  for (const format of ['wav', 'ogg'] as const) {
    const p = resolve(root, a[format]);
    if (!p.startsWith(root + sep) || !existsSync(p)) { errors.push(`Missing/unsafe asset: ${a.id}`); continue; }
    if (createHash('sha256').update(readFileSync(p)).digest('hex') !== a[`sha256_${format}`]) errors.push(`Hash mismatch: ${a.id}/${format}`);
  }
}
for (const [event, v] of Object.entries(manifest.events)) if (!v.variants.length || v.variants.some(id => !ids.has(id))) errors.push(`Bad mapping: ${event}`);
console.log(JSON.stringify({ status: errors.length ? 'FAIL' : 'PASS', assets: ids.size, encodings: ids.size * 2, events: Object.keys(manifest.events).length, errors }, null, 2));
if (errors.length) process.exitCode = 1;
