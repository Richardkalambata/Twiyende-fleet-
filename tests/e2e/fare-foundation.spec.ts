import { expect, test, type Page } from '@playwright/test';
import { DEMO_PIN, PHONES } from '../../lib/constants';

async function login(page: Page, route: string, phone: string, destination: string) {
  await page.goto(route);
  await page.getByRole('textbox', { name: 'Phone number' }).fill(phone);
  await page.getByRole('textbox', { name: 'Six-digit PIN' }).fill(DEMO_PIN);
  await page.getByRole('button', { name: 'Log in' }).click();
  await page.waitForURL((url) => url.pathname === destination);
}

test('the three roles stay signed in independently and the fare flow skips map downloads', async ({ context, page }) => {
  const requests: string[] = [];
  page.on('request', (request) => requests.push(new URL(request.url()).pathname));
  await login(page, '/login?bus=12', PHONES.richard, '/pay');
  await expect(page.getByRole('textbox', { name: 'Bus number' })).toHaveValue('12');
  await expect(page.getByText('Town to Matero')).toBeVisible();
  expect(requests).not.toContain('/api/fare-bus');

  await page.getByRole('textbox', { name: 'Bus number' }).fill('15');
  await expect(page.getByText('Town to Chilenje')).toBeVisible();
  expect(requests.filter((route) => route === '/api/fare-bus')).toHaveLength(1);
  await page.goto('/map');
  await expect(page.getByRole('button', { name: /load live map|track your bus/i })).toBeVisible();
  expect(requests).not.toContain('/api/buses/live');

  const operator = await context.newPage();
  const conductor = await context.newPage();
  await login(operator, '/business/login', PHONES.owner, '/business/desk');
  await login(conductor, '/business/conductor/login', PHONES.mwila, '/business/drive');
  const cookies = (await context.cookies()).filter((cookie) => /^twende_(rider|conductor|operator)_session$/.test(cookie.name));
  expect(cookies).toHaveLength(3);
  expect(cookies.every((cookie) => cookie.httpOnly)).toBe(true);

  await page.goto('/home');
  await expect(page.getByRole('link', { name: /pay a fare/i })).toBeVisible();
  await operator.reload();
  await expect(operator.getByRole('heading', { name: 'Your fleet, at a glance.' })).toBeVisible();
  await conductor.goto('/business/drive/profile');
  await conductor.locator('main').getByRole('button', { name: 'Log out' }).click();
  await expect(conductor).toHaveURL(/\/business\/conductor\/login$/);
  expect((await page.request.get('/api/notifications?role=conductor')).status()).toBe(401);
  expect((await page.request.get('/api/notifications?role=passenger')).status()).toBe(200);
  expect((await page.request.get('/api/notifications?role=operator')).status()).toBe(200);
});
