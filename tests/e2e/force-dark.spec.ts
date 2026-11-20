import { test } from '@playwright/test';
import { assertLightControls } from './contrast';

test.use({
  colorScheme: 'dark',
  viewport: { width: 412, height: 915 },
  launchOptions: {
    args: ['--force-dark-mode', '--enable-features=WebContentsForceDark'],
  },
});

test('forced Chrome dark mode keeps the light UI', async ({ page }, testInfo) => {
  await page.goto('/login');
  await assertLightControls(page);
  await page.screenshot({ path: testInfo.outputPath('dark-signin-412.png') });

  await page.getByRole('button', { name: /Richard/ }).click();
  await page.waitForURL('**/home');
  await page.getByRole('heading', { name: 'Richard' }).waitFor();
  await page.waitForTimeout(600);
  await assertLightControls(page);
  await page.screenshot({ path: testInfo.outputPath('dark-home-412.png') });

  await page.getByRole('button', { name: /Pay a fare/ }).click();
  await page.getByLabel('Bus number').fill('12');
  await page.getByText('Town to Matero').waitFor();
  await assertLightControls(page);
  await page.screenshot({ path: testInfo.outputPath('dark-pay-412.png') });

  await page.context().clearCookies();
  await page.goto('/business/login');
  await page.getByRole('button', { name: /Richard/ }).click();
  await page.waitForURL('**/business/desk**');
  await assertLightControls(page);
  await page.screenshot({ path: testInfo.outputPath('dark-desk-412.png') });

  await page.context().clearCookies();
  await page.goto('/business/conductor/login');
  await page.getByRole('button', { name: /Mwila/ }).click();
  await page.waitForURL('**/business/drive**');
  await page.goto('/business/drive/lost');
  await page.getByRole('button', { name: 'Bag' }).waitFor();
  await assertLightControls(page);
  await page.screenshot({ path: testInfo.outputPath('dark-lost-412.png') });
});
