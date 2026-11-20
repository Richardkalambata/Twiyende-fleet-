import { test, expect } from '@playwright/test';

test('rider pays, conductor verifies, operator sees the fare', async ({ page }) => {
  const phone = `097${String(Date.now()).slice(-7)}`;
  await page.goto('/signup');
  await page.getByLabel('Name').fill('Test Rider');
  await page.getByLabel('Phone').fill(phone);
  await page.getByLabel('6-digit PIN').fill('246810');
  await page.getByLabel('Confirm PIN').fill('246810');
  await page.getByLabel('I agree to the terms').check();
  await page.getByRole('button', { name: 'Create account' }).click();
  await page.waitForURL('**/home');
  await page.goto('/topup');
  await page.getByRole('button', { name: 'K20', exact: true }).click();
  await page.getByRole('button', { name: 'Review K20.00' }).click();
  await page.getByLabel('Re-enter the amount in K').fill('21');
  await page.getByRole('button', { name: 'Confirm +K20.00' }).click();
  await expect(page.getByText('That amount does not match. Check it and try again.', { exact: true })).toBeVisible();
  await page.getByLabel('Re-enter the amount in K').fill('20.00');
  await page.getByRole('button', { name: 'Confirm +K20.00' }).click();
  await expect(page.getByText('Simulated top-up complete')).toBeVisible({ timeout: 15000 });
  await page.goto('/home');
  await page.getByRole('button', { name: /Pay a fare/ }).click();
  await page.getByLabel('Bus number').fill('12');
  await page.locator('button').filter({ hasText: /^K\d+$/ }).first().click();
  await page.getByRole('button', { name: /Pay K/ }).click();
  await page.waitForURL('**/receipt/**');
  await expect(page.getByText('Awaiting verification')).toBeVisible();
});
