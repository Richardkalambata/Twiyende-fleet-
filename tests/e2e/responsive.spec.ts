import { expect, test } from '@playwright/test';

const roles = [
  { login: '/login', name: /Richard/, landed: '/home', signInRole: 'Rider', nav: 'Passenger' },
  { login: '/business/conductor/login', name: /Mwila/, landed: '/business/drive', signInRole: 'Conductor', nav: 'Conductor' },
  { login: '/business/login', name: /Richard/, landed: '/business/desk', signInRole: 'Operator', nav: 'Fleet' },
];

for (const role of roles) {
  test(`${role.nav} workspace at phone, tablet, and desktop widths`, async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 640 });
    await page.goto(role.login);
    await page.setViewportSize({ width: 1440, height: 900 });
    await expect(page.locator('main#main')).toHaveCSS('display', 'grid');
    await expect(page.getByLabel('Six-digit PIN')).toBeVisible();
    if (role.signInRole === 'Rider') {
      await expect(page.getByRole('link', { name: 'Twende Rider home' })).toHaveAttribute('href', '/');
      await expect(page.getByRole('link', { name: /operator|conductor/i })).toHaveCount(0);
    } else {
      await expect(page.getByRole('link', { name: 'Twende Fleet Business home' })).toHaveAttribute('href', '/business');
      await expect(page.getByRole('link', { name: /Are you (a conductor|the operator)/i })).toBeVisible();
    }
    await page.getByRole('button', { name: role.name }).click();
    await page.waitForURL(`**${role.landed}`);
    for (const width of [320, 390, 768, 1024, 1440, 1920]) {
      await page.setViewportSize({ width, height: width <= 390 ? 640 : 900 });
      await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth)).toBe(width);
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
