import { createHash } from 'node:crypto';
import { copyFile, lstat, mkdir, readFile, realpath } from 'node:fs/promises';
import { dirname, resolve, sep } from 'node:path';

const source = resolve('plan/ironvale_design_pack/audio');
const destination = resolve('public/audio');
const manifestBytes = await readFile(resolve(source, 'manifest.json'));
const expectedManifestHash = 'dc568e15646fb15cb9f02db79d8aa8ab679a50bf886f09c3d28be725b3bc5251';
if (createHash('sha256').update(manifestBytes).digest('hex') !== expectedManifestHash) throw new Error('Supplied manifest provenance mismatch');
const manifest = JSON.parse(manifestBytes.toString()) as { asset_count: number; assets: { id: string; wav: string; ogg: string; sha256_wav: string; sha256_ogg: string }[]; events: Record<string, { variants: string[] }> };
const files: string[] = [];
const ids = new Set<string>();
for (const asset of manifest.assets) {
  if (ids.has(asset.id)) throw new Error(`Duplicate asset ${asset.id}`);
  ids.add(asset.id);
  for (const format of ['wav', 'ogg'] as const) {
    const relative = asset[format];
    if (!relative || relative.includes('\\') || relative.split('/').some(part => !part || part === '..' || part === '.') || relative.startsWith('/')) throw new Error(`Unsafe asset path ${relative}`);
    const path = resolve(source, relative);
    if (!(await realpath(path)).startsWith(source + sep)) throw new Error(`Asset escapes source: ${relative}`);
    const hash = createHash('sha256').update(await readFile(path)).digest('hex');
    if (hash !== asset[`sha256_${format}`]) throw new Error(`Hash mismatch ${relative}`);
    files.push(relative);
  }
}
if (ids.size !== manifest.asset_count) throw new Error('Asset count mismatch');
const referenced = new Set<string>();
for (const [name, event] of Object.entries(manifest.events)) {
  if (!event.variants.length) throw new Error(`No variants: ${name}`);
  for (const variant of event.variants) { if (!ids.has(variant)) throw new Error(`Missing variant ${name}: ${variant}`); referenced.add(variant); }
}
if (referenced.size !== ids.size) throw new Error('Unreferenced assets');
// Validate everything before touching the served copy. Refuse symlinks at every output component.
for (const relative of ['manifest.json', ...files]) {
  const target = resolve(destination, relative);
  const segments = target.slice(resolve('.').length + 1).split(sep);
  let current = resolve('.');
  for (const segment of segments) {
    current = resolve(current, segment);
    const stat = await lstat(current).catch((error: NodeJS.ErrnoException) => { if (error.code !== 'ENOENT') throw error; return undefined; });
    if (stat?.isSymbolicLink()) throw new Error(`Refusing output symlink ${current}`);
  }
}
for (const relative of ['manifest.json', ...files]) {
  const target = resolve(destination, relative);
  await mkdir(dirname(target), { recursive: true });
  await copyFile(resolve(source, relative), target);
  if (!Buffer.from(await readFile(target)).equals(await readFile(resolve(source, relative)))) throw new Error(`Copy verification failed ${relative}`);
}
console.log(`Verified and copied ${ids.size} logical clips / ${files.length} hashes / ${Object.keys(manifest.events).length} events. Manifest SHA-256 ${createHash('sha256').update(manifestBytes).digest('hex')}`);
