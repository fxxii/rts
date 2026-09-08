import { test, expect } from '@playwright/test';
import { writeFile } from 'node:fs/promises';
test('records 1080p development-practice frame timing on the available software renderer', async ({ page, browser }) => {
  test.skip(!!process.env.TEST_BASE_URL, 'Diagnostics are intentionally absent from production.');
  await page.setViewportSize({ width: 1920, height: 1080 });
  await page.goto('/'); await page.getByRole('button', { name: 'Start practice' }).click();
  await expect(page.locator('#lobby')).toBeHidden();
  const read = () => page.evaluate(() => (window as unknown as { ironvaleDiagnostics: { view: { tick: number }; renderer: { frames: number; frameTimes: number[]; drawCalls: number; entities: number } } }).ironvaleDiagnostics);
  const first = await read();
  await expect.poll(async () => (await read()).view.tick, { timeout: 30000 }).toBeGreaterThan(first.view.tick + 200);
  const last = await read();
  const samples = last.renderer.frameTimes.slice(-(last.renderer.frames - first.renderer.frames)).sort((a, b) => a - b);
  expect(samples.length).toBeGreaterThan(30);
  const result = { recordedAt: new Date().toISOString(), browser: browser.version(), viewport: [1920, 1080], backend: 'Playwright headless Chromium, ANGLE SwiftShader; software rendering',
    fixture: 'Unmodified starting practice view with live bot/server; 200 simulation ticks; normal audio active; no orders',
    frameMs: { p50: samples[Math.floor(samples.length * .5)], p95: samples[Math.floor(samples.length * .95)], p99: samples[Math.floor(samples.length * .99)], max: samples.at(-1), samples: samples.length },
    drawCalls: last.renderer.drawCalls, visibleEntities: last.renderer.entities,
    limitations: ['Not a 400-visible-unit renderer benchmark.', 'Software GPU does not measure physical M1 Pro/M1 Air GPU performance.', 'Short automated sample does not establish long-session or human experience.'] };
  await writeFile('docs/evidence/frames.json', JSON.stringify(result, null, 2) + '\n');
});
