import { test } from '@playwright/test';
import { assertLightControls } from './contrast';

test.use({ colorScheme: 'dark', viewport: { width: 412, height: 915 } });

test('controls stay readable when the device prefers dark', async ({ page }) => {
  await page.goto('/login');
  await assertLightControls(page);

  await page.getByRole('button', { name: /Richard/ }).click();
  await page.waitForURL('**/home');
  await page.getByRole('heading', { name: 'Richard' }).waitFor();
  await page.waitForTimeout(600);
  await assertLightControls(page);

  await page.getByRole('link', { name: /Pay a fare/ }).click();
  await page.getByLabel('Bus number').waitFor();
  await assertLightControls(page);

  await page.context().clearCookies();
  await page.goto('/business/login');
  await page.getByRole('button', { name: /Richard/ }).click();
  await page.waitForURL('**/business/desk**');
  await assertLightControls(page);

  await page.context().clearCookies();
  await page.goto('/business/conductor/login');
  await page.getByRole('button', { name: /Mwila/ }).click();
  await page.waitForURL('**/business/drive**');
  await page.goto('/business/drive/lost');
  await page.getByRole('button', { name: 'Bag' }).waitFor();
  await assertLightControls(page);
});
