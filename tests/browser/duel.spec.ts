import { test, expect } from '@playwright/test';
test('two isolated browser players create, join, play, resign and agree to rematch', async ({ browser, baseURL }) => {
  const a = await browser.newContext({ baseURL }), b = await browser.newContext({ baseURL }); const p1 = await a.newPage(), p2 = await b.newPage();
  try {
    await p1.goto('/'); await p1.getByRole('button', { name: 'Create online duel' }).click();
    await expect(p1.locator('#room-name')).toHaveText(/[A-F0-9]{6}/); const room = await p1.locator('#room-name').textContent();
    await p2.goto('/'); await p2.getByRole('textbox', { name: 'Room code' }).fill('ZZZZZZ'); await p2.getByRole('button', { name: 'Join duel' }).click();
    await expect(p2.locator('#lobby-status')).toHaveText('Room not found');
    await p2.getByRole('textbox', { name: 'Room code' }).fill(room!); await p2.getByRole('button', { name: 'Join duel' }).click();
    await p1.getByRole('button', { name: 'Ready to battle' }).click(); await p2.getByRole('button', { name: 'Ready to battle' }).click();
    await expect(p1.locator('#lobby')).toBeHidden(); await expect(p2.locator('#lobby')).toBeHidden();
    await p1.getByRole('button', { name: /Train Worker/ }).click(); await expect(p1.locator('#food')).toHaveText('150'); await expect(p2.locator('#food')).toHaveText('200');
    await p1.getByRole('button', { name: 'Settings and controls' }).click(); await p1.getByRole('button', { name: 'Resign match' }).click();
    await expect(p2.locator('#result-title')).toHaveText('Victory is yours');
    await p1.getByRole('button', { name: 'Rematch →', exact: true }).click(); await p2.getByRole('button', { name: 'Rematch →', exact: true }).click();
    await expect(p1.locator('#results')).toBeHidden(); await expect(p2.locator('#results')).toBeHidden();
    await expect(p1.locator('#food')).toHaveText('200');
  } finally { await a.close(); await b.close(); }
});
