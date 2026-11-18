import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  timeout: 90_000,
  use: { baseURL: process.env.BASE_URL || 'http://127.0.0.1:3040' },
  webServer: {
    command: 'node tests/e2e/ensure-db.mjs && npx next start -p 3040',
    url: 'http://127.0.0.1:3040',
    reuseExistingServer: true,
    timeout: 120_000,
    env: {
      DATABASE_URL: 'postgres://twende:twende@127.0.0.1:5432/twende_e2e',
      DATABASE_URL_UNPOOLED: 'postgres://twende:twende@127.0.0.1:5432/twende_e2e',
      PAYMENT_PROVIDER: 'simulated',
    },
  },
});
