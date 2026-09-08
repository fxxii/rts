import { test, expect } from '@playwright/test';
import type { AudioEngine } from '../../src/client/audio';

declare global { interface Window { audioTest: AudioEngine; audioReady: boolean } }

test('real practice events play and reload reconnect activates the actual game audio', async ({ page }) => {
  await page.goto('/'); await page.getByRole('button', { name: 'Start practice' }).click();
  await expect(page.locator('#lobby')).toBeHidden();
  await page.getByRole('button', { name: /Train Worker/ }).click();
  await page.keyboard.press('.'); await page.getByRole('button', { name: 'Gather food', exact: true }).click();
  const diagnostics = () => page.evaluate(() => (window as unknown as { ironvaleDiagnostics: { audio: { state: string; started: Record<string, number> } } }).ironvaleDiagnostics.audio);
  await expect.poll(async () => (await diagnostics()).started['economy.harvest'] ?? 0, { timeout: 20000 }).toBeGreaterThan(0).catch(async error => { console.log(await diagnostics(), await page.locator('#selection-detail').textContent()); throw error; });
  await expect.poll(async () => (await diagnostics()).started['alerts.unit_complete'] ?? 0, { timeout: 15000 }).toBeGreaterThan(0);
  await page.reload(); await page.getByRole('button', { name: 'Reconnect to match', exact: true }).click();
  await expect(page.locator('#lobby')).toBeHidden();
  await expect.poll(async () => (await diagnostics()).state).toBe('running');
  await expect.poll(async () => (await diagnostics()).started['music.explore'] ?? 0).toBeGreaterThan(0);
});

async function openAudio(page: import('@playwright/test').Page) {
  await page.goto('/');
  await page.evaluate(async () => {
    const modulePath = '/src/client/audio.ts';
    const { AudioEngine } = await import(/* @vite-ignore */ modulePath);
    window.audioTest = new AudioEngine();
    window.audioReady = false;
    const button = document.createElement('button');
    button.id = 'audio-test-start'; button.textContent = 'Enable test audio';
    Object.assign(button.style, { position: 'fixed', top: '8px', left: '8px', zIndex: '2147483647' });
    button.onclick = () => { void window.audioTest.start().then(() => { window.audioReady = true; }); };
    document.body.append(button);
  });
  await page.locator('#audio-test-start').click();
  await expect.poll(() => page.evaluate(() => window.audioReady)).toBe(true);
}

test('user activation, one group acknowledgment, persistent buses and cleanup', async ({ page }) => {
  await openAudio(page);
  expect(await page.evaluate(() => window.audioTest.getEventNames().length)).toBe(79);
  expect(await page.evaluate(() => window.audioTest.getDiagnostics().state)).toBe('running');
  await page.evaluate(() => {
    // The UI calls once per group; simultaneous duplicates must not multiply voices.
    for (let i = 0; i < 20; i++) window.audioTest.play('voice.soldier_move');
    for (const bus of ['master', 'effects', 'voice', 'alerts', 'ambience', 'music'] as const) window.audioTest.setVolume(bus, .23);
  });
  await expect.poll(() => page.evaluate(() => window.audioTest.getDiagnostics().started['voice.soldier_move'])).toBe(1);
  await expect.poll(() => page.evaluate(() => window.audioTest.getDiagnostics().activeSources)).toBe(0);
  expect(await page.evaluate(() => Object.values(window.audioTest.getVolumes()))).toEqual(Array(6).fill(.23));
  await page.evaluate(() => window.audioTest.dispose());
  expect(await page.evaluate(() => window.audioTest.getDiagnostics())).toMatchObject({ activeSources: 0, pendingSources: 0, decodedAssets: 0, state: 'closed' });
  await openAudio(page);
  expect(await page.evaluate(() => Object.values(window.audioTest.getVolumes()))).toEqual(Array(6).fill(.23));
  await page.evaluate(() => window.audioTest.dispose());
});

test('Ogg failure falls back to original WAV; pending work cannot survive dispose', async ({ page }) => {
  await page.route('**/audio/**/*.ogg', route => route.fulfill({ status: 200, body: 'invalid ogg' }));
  await openAudio(page);
  await page.evaluate(() => window.audioTest.play('ui.click'));
  await expect.poll(() => page.evaluate(() => window.audioTest.getDiagnostics().started['ui.click'])).toBe(1);
  expect(await page.evaluate(() => window.audioTest.getDiagnostics().fallbacks)).toBe(1);
  await page.evaluate(() => { window.audioTest.play('voice.victory'); window.audioTest.dispose(); });
  await expect.poll(() => page.evaluate(() => window.audioTest.getDiagnostics().pendingSources)).toBe(0);
  expect(await page.evaluate(() => window.audioTest.getDiagnostics().activeSources)).toBe(0);
});

test('all original encodings decode in browser with manifest channel and duration metadata', async ({ page }) => {
  test.setTimeout(120_000);
  await page.goto('/');
  const result = await page.evaluate(async () => {
    const context = new AudioContext();
    const manifest = await (await fetch('/audio/manifest.json')).json();
    const errors: string[] = []; let decoded = 0;
    for (const asset of manifest.assets) for (const format of ['ogg', 'wav']) {
      try {
        const response = await fetch(`/audio/${asset[format]}`);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const buffer = await context.decodeAudioData(await response.arrayBuffer());
        if (buffer.numberOfChannels !== asset.channels || Math.abs(buffer.duration - asset.duration_seconds) > .05) throw new Error('Metadata differs');
        decoded++;
      } catch (error) { errors.push(`${asset.id}.${format}: ${String(error)}`); }
    }
    await context.close(); return { decoded, errors };
  });
  expect(result).toEqual({ decoded: 278, errors: [] });
});

test('paired loops crossfade, voices duck music, and source budget stays bounded', async ({ page }) => {
  await openAudio(page);
  await page.evaluate(() => window.audioTest.setBattle(false));
  await expect.poll(() => page.evaluate(() => window.audioTest.getDiagnostics().music.length)).toBe(2);
  await expect.poll(() => page.evaluate(() => window.audioTest.getDiagnostics().music.find(item => item.name === 'music.explore')!.gain)).toBeGreaterThan(.45);
  await page.evaluate(() => window.audioTest.setBattle(true));
  await expect.poll(() => page.evaluate(() => window.audioTest.getDiagnostics().music.find(item => item.name === 'music.explore')!.gain)).toBeLessThan(.05);
  await page.evaluate(() => window.audioTest.play('voice.under_attack'));
  await expect.poll(() => page.evaluate(() => window.audioTest.getDiagnostics().music.find(item => item.name === 'music.battle')!.gain)).toBeLessThan(.25);
  await page.evaluate(() => { for (const name of window.audioTest.getEventNames()) window.audioTest.play(name, { x: 30, z: 30 }); });
  await expect.poll(() => page.evaluate(() => window.audioTest.getDiagnostics().pendingSources)).toBe(0);
  expect(await page.evaluate(() => window.audioTest.getDiagnostics().activeSources)).toBeLessThanOrEqual(32);
  await page.evaluate(() => window.audioTest.dispose());
});
