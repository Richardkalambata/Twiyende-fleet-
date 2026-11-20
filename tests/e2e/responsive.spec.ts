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
    const roleNavigation = page.getByRole('navigation', { name: 'Sign-in roles' });
    await expect(roleNavigation).toBeHidden();
    await page.setViewportSize({ width: 1440, height: 900 });
    await expect(roleNavigation).toBeVisible();
    await expect(roleNavigation.getByRole('link', { name: role.signInRole, exact: true })).toHaveAttribute('aria-current', 'page');
    await expect(page.getByLabel('Six-digit PIN')).toBeVisible();
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
