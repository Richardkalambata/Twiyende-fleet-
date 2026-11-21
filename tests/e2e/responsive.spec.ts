import { expect, test } from '@playwright/test';

const roles = [
  { login: '/login', name: /Richard/, landed: '/home', nav: 'Passenger' },
  { login: '/business/conductor/login', name: /Mwila/, landed: '/business/drive', nav: 'Conductor' },
  { login: '/business/login', name: /Richard/, landed: '/business/desk', nav: 'Fleet' },
];

for (const role of roles) {
  test(`${role.nav} workspace at phone, tablet, and desktop widths`, async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 640 });
    await page.goto(role.login);
    const loginPage = page.locator('main#main');
    for (const width of [320, 768, 1440]) {
      await page.setViewportSize({ width, height: 900 });
      await expect.poll(async () => (await loginPage.boundingBox())?.width).toBe(width);
      const pin = page.getByLabel('Six-digit PIN');
      await expect(pin).toBeVisible();
      const phoneBox = await page.getByLabel('Phone number').boundingBox();
      const pinBox = await pin.boundingBox();
      expect(phoneBox).not.toBeNull();
      expect(pinBox).not.toBeNull();
      if (phoneBox && pinBox) {
        expect(pinBox.x).toBe(phoneBox.x);
        expect(pinBox.width).toBe(phoneBox.width);
        expect(pinBox.y).toBeGreaterThanOrEqual(phoneBox.y + phoneBox.height);
      }
    }
    if (role.nav === 'Passenger') {
      await expect(page.getByRole('link', { name: /operator|conductor/i })).toHaveCount(0);
    } else {
      await expect(page.getByRole('link', { name: /are you (a conductor|the operator)/i })).toBeVisible();
    }
    await page.getByRole('button', { name: role.name }).click();
    await page.waitForURL(`**${role.landed}`);
    for (const width of [320, 390, 768, 1024, 1440, 1920]) {
      await page.setViewportSize({ width, height: width <= 390 ? 640 : 900 });
      await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth)).toBe(width);
      await expect.poll(async () => (await page.locator('[data-workspace]').boundingBox())?.width).toBe(width);
      if (role.nav !== 'Fleet') {
        const shell = page.locator('.twende-shell[data-workspace]');
        await expect(shell).toHaveCSS('flex-direction', width >= 1024 ? 'row' : 'column');
        await expect(page.getByRole('navigation', { name: role.nav })).toBeVisible();
      } else {
        const navigation = page.locator('nav[aria-label="Fleet"]');
        if (width >= 768) await expect(navigation).toBeVisible();
        else await expect(navigation).toBeHidden();
      }
    }
  });
}
