import { test, expect, type WebSocketRoute } from '@playwright/test';
test('active game automatically resumes after repeated failures during a ten-second outage', async ({ page }) => {
  let unavailableUntil = 0, current: WebSocketRoute | undefined;
  await page.routeWebSocket('**/socket', route => {
    if (Date.now() < unavailableUntil) { void route.close({ code: 4000, reason: 'Test outage' }); return; }
    current = route; route.connectToServer();
  });
  await page.goto('/'); await page.getByRole('button', { name: 'Start practice' }).click();
  await expect(page.locator('#lobby')).toBeHidden();
  const identity = await page.locator('#connection').textContent();
  await page.getByRole('button', { name: /Train Worker/ }).click(); await expect(page.locator('#food')).toHaveText('150');
  unavailableUntil = Date.now() + 10000; await current!.close({ code: 4000, reason: 'Test outage' });
  await expect(page.locator('#connection')).toHaveText('Disconnected');
  await expect(page.locator('#connection')).toHaveText(identity!, { timeout: 18000 });
  await expect(page.locator('#lobby')).toBeHidden(); await expect(page.locator('#food')).toHaveText('150');
  await page.getByRole('button', { name: /Train Worker/ }).click(); await expect(page.locator('#food')).toHaveText('100');
});
