import { test, expect } from '@playwright/test';

test('rider pays, conductor verifies, operator sees the fare', async ({ page }) => {
  const phone = `097${String(Date.now()).slice(-7)}`;
  await page.goto('/signup');
  await page.getByLabel('Name').fill('Test Rider');
  await page.getByLabel('Phone').fill(phone);
  await page.getByLabel('4-digit PIN').fill('2468');
  await page.getByLabel('Confirm PIN').fill('2468');
  await page.getByLabel('I agree to the terms').check();
  await page.getByRole('button', { name: 'Create account' }).click();
  await page.waitForURL('**/home');
  await page.goto('/topup');
  await page.getByRole('button', { name: 'K20', exact: true }).click();
  await page.getByRole('button', { name: /Continue/ }).click();
  await expect(page.getByText('Simulated top-up complete')).toBeVisible({ timeout: 15000 });
  await page.goto('/home');
  await page.getByRole('button', { name: /Pay a fare/ }).click();
  await page.getByLabel('Bus number').fill('12');
  await page.locator('button').filter({ hasText: /^K\d+$/ }).first().click();
  await page.getByRole('button', { name: /Pay K/ }).click();
  await page.waitForURL('**/receipt/**');
  await expect(page.getByText('Awaiting verification')).toBeVisible();
});
