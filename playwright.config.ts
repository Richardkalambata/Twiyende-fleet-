import { defineConfig } from '@playwright/test';
import { E2E_BASE_URL, E2E_DATABASE_URL } from './tests/db-guard';

const baseURL = process.env.BASE_URL || E2E_BASE_URL;

export default defineConfig({
  testDir: './tests/e2e',
  timeout: 90_000,
  globalSetup: './tests/e2e/global-setup.ts',
  use: { baseURL },
  webServer: {
    command: 'node tests/e2e/ensure-db.mjs && npx next start -p 3050',
    url: E2E_BASE_URL,
    reuseExistingServer: false,
    timeout: 120_000,
    env: {
      DATABASE_URL: E2E_DATABASE_URL,
      DATABASE_URL_UNPOOLED: E2E_DATABASE_URL,
      PAYMENT_PROVIDER: 'simulated',
    },
  },
});
