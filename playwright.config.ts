import { defineConfig } from '@playwright/test';
export default defineConfig({ testDir: './tests/browser', fullyParallel: false, workers: 1, timeout: 60000, expect: { timeout: 10000 },
  use: { baseURL: process.env.TEST_BASE_URL ?? 'http://127.0.0.1:5173', viewport: { width: 1440, height: 900 }, screenshot: 'only-on-failure', trace: 'retain-on-failure', launchOptions: { args: ['--use-gl=angle', '--use-angle=swiftshader'] } },
  webServer: process.env.TEST_BASE_URL ? undefined : { command: 'npm run dev', url: 'http://127.0.0.1:5173', reuseExistingServer: true, timeout: 30000 }
});
