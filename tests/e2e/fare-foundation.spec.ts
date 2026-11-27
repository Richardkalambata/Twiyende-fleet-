import { expect, test, type Page } from '@playwright/test';
import { DEMO_PIN, PHONES } from '../../lib/constants';

async function login(page: Page, route: string, phone: string, destination: string) {
  await page.goto(route);
  await page.getByRole('textbox', { name: 'Phone number' }).fill(phone);
  await page.getByRole('textbox', { name: 'Six-digit PIN' }).fill(DEMO_PIN);
  await page.getByRole('button', { name: 'Log in' }).click();
  await page.waitForURL((url) => url.pathname === destination);
}

test('the rider welcome and sign-in stay clear of fare controls', async ({ page }) => {
  await page.addInitScript(() => {
    const root = window as Window & { twendeRiderScanner?: { postMessage: (value: string) => void } };
    root.twendeRiderScanner = {
      postMessage: (value) => document.documentElement.dataset.scannerMessage = value,
    };
  });
  await page.setViewportSize({ width: 412, height: 820 });
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Pay your bus fare in seconds.' })).toBeVisible();
  await expect(page.locator('.brand-entry')).toHaveCount(0);
  await page.locator('#hero-ctas').getByRole('link', { name: 'Sign in' }).click();
  await expect(page).toHaveURL(/\/login$/);
  await expect(page.getByRole('textbox', { name: 'Bus number' })).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Scan bus QR code' })).toHaveCount(0);
  await expect(page.locator('.brand-entry')).toHaveCount(0);
  await page.getByRole('textbox', { name: 'Phone number' }).fill(PHONES.richard);
  await page.getByRole('textbox', { name: 'Six-digit PIN' }).fill(DEMO_PIN);
  await page.getByRole('button', { name: 'Log in' }).click();
  await expect(page).toHaveURL(/\/home$/);
  await expect(page.getByRole('button', { name: 'Scan bus QR code' })).toHaveCount(0);
  await expect(page.locator('.brand-entry')).toHaveCount(0);
  await page.getByRole('link', { name: /Pay a fare/ }).click();
  await expect(page.getByRole('textbox', { name: 'Bus number' })).toBeVisible();
  await page.getByRole('button', { name: 'Scan bus QR code' }).click();
  await expect(page.locator('html')).toHaveAttribute('data-scanner-message', 'scan');
});

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

test('authenticated tracking requires same-origin JSON and an active shift', async ({ page }) => {
  await login(page, '/business/conductor/login', PHONES.mwila, '/business/drive');
  const base = new URL(page.url()).origin;
  const wrongOrigin = await page.request.post('/api/shifts', {
    headers: { origin: 'http://sibling.example.test' }, data: { action: 'start' },
  });
  expect(wrongOrigin.status()).toBe(403);

  const shift = await page.evaluate(async () => {
    const response = await fetch('/api/shifts', {
      method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ action: 'start' }),
    });
    return { status: response.status, ...(await response.json() as { busId?: string }) };
  });
  expect(shift.status, JSON.stringify(shift)).toBe(200);
  expect(shift.busId).toBeTruthy();
  const endpoint = `/api/buses/${shift.busId}/location`;
  const invalid = await page.request.post(endpoint, { headers: { origin: base }, data: { lat: null, lng: 28.28 } });
  expect(invalid.status()).toBe(400);
  const recorded = await page.request.post(endpoint, { headers: { origin: base }, data: { lat: -15.4, lng: 28.28 } });
  expect(recorded.status()).toBe(200);
  expect(recorded.headers()['cache-control']).toContain('no-store');
  expect(recorded.headers()['x-content-type-options']).toBe('nosniff');
  const ended = await page.request.post('/api/shifts', { headers: { origin: base }, data: { action: 'end' } });
  expect(ended.status()).toBe(200);
  const offShift = await page.request.post(endpoint, { headers: { origin: base }, data: { lat: -15.4, lng: 28.28 } });
  expect(offShift.status()).toBe(403);
});

test('Twende bus signs print, download, and scan into the rider fare form', async ({ page, context }) => {
  const operator = await context.newPage();
  await operator.addInitScript(() => {
    const markPrinted = () => document.body.setAttribute('data-print-requested', 'yes');
    window.print = markPrinted;
  });
  await login(operator, '/business/login', PHONES.owner, '/business/desk');
  await operator.goto('/business/desk/buses');
  await operator.getByRole('article').filter({ has: operator.getByRole('heading', { name: 'Bus 12', exact: true }) })
    .getByRole('link', { name: 'Print or download bus sign' }).click();
  await expect(operator.getByRole('heading', { name: 'Bus 12 sign' })).toBeVisible();
  const sign = await operator.getByRole('img', { name: /Twende sign for Bus 12/ }).getAttribute('src');
  expect(sign).toMatch(/^data:image\/svg\+xml;base64,/);
  await operator.getByRole('button', { name: 'Print sign' }).click();
  await expect(operator.locator('body')).toHaveAttribute('data-print-requested', 'yes');
  const downloadedSign = operator.waitForEvent('download');
  await operator.getByRole('button', { name: 'Download PNG' }).click();
  expect((await downloadedSign).suggestedFilename()).toBe('twende-bus-12.png');

  await page.addInitScript((artwork) => {
    Object.defineProperty(navigator.mediaDevices, 'getUserMedia', {
      configurable: true,
      value: async () => {
        const image = new Image();
        image.src = artwork;
        await image.decode();
        const canvas = document.createElement('canvas');
        canvas.width = 600;
        canvas.height = 600;
        const ctx = canvas.getContext('2d')!;
        // Feed the QR area of the actual sign to the scanner.
        const stream = canvas.captureStream(8);
        const track = stream.getVideoTracks()[0];
        const draw = () => ctx.drawImage(image, 219, 567, 356, 356, 0, 0, 600, 600);
        draw();
        const timer = window.setInterval(() => {
          if (track.readyState === 'ended') window.clearInterval(timer);
          else draw();
        }, 140);
        return stream;
      },
    });
  }, sign!);
  await login(page, '/login', PHONES.richard, '/home');
  await page.goto('/pay');
  await page.getByRole('button', { name: 'Scan bus QR code' }).click();
  await expect(page.getByRole('textbox', { name: 'Bus number' })).toHaveValue('12');
  await expect(page.getByText('Town to Matero', { exact: true })).toBeVisible();
  await expect(page).toHaveURL(/\/pay$/);
  await expect(page.getByRole('region', { name: 'Bus QR scanner' })).toHaveCount(0);
  await page.getByRole('textbox', { name: 'Bus number' }).fill('15');
  await expect(page.getByText('Town to Chilenje', { exact: true })).toBeVisible();
});
