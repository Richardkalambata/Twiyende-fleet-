import { expect, test, type ConsoleMessage, type Page } from '@playwright/test';

test('every public link from the landing pages resolves', async ({ page, baseURL }) => {
  const origin = new URL(baseURL ?? 'http://127.0.0.1:3050');
  const queue = ['/', '/business'];
  const seen = new Set<string>();
  const failures: string[] = [];

  while (queue.length > 0) {
    const target = queue.shift() ?? '/';
    const path = target.split('#')[0] || '/';
    if (seen.has(path)) continue;
    seen.add(path);
    const problems = await visit(page, path);
    failures.push(...problems.map((problem) => `${path}: ${problem}`));
    const hrefs = await page.locator('a[href]').evaluateAll((nodes) => nodes.map((node) => node.getAttribute('href') ?? ''));
    for (const href of hrefs) {
      if (href === '' || href === '#') {
        failures.push(`${path}: dead link ${href || '(empty)'}`);
        continue;
      }
      if (href.startsWith('mailto:') || href.startsWith('tel:')) continue;
      let url: URL;
      try {
        url = new URL(href, origin);
      } catch {
        failures.push(`${path}: unreadable link ${href}`);
        continue;
      }
      if (url.origin !== origin.origin) continue;
      const next = `${url.pathname}${url.search}`;
      if (!seen.has(next)) queue.push(next);
    }
  }

  expect(failures, failures.join('\n')).toEqual([]);
  expect(seen.size).toBeGreaterThan(4);
});

async function visit(page: Page, path: string): Promise<string[]> {
  const problems: string[] = [];
  const onConsole = (message: ConsoleMessage) => {
    if (message.type() !== 'error') return;
    const text = message.text();
    if (/favicon|Download the React DevTools/i.test(text)) return;
    problems.push(text);
  };
  const onError = (error: Error) => problems.push(error.message);
  page.on('console', onConsole);
  page.on('pageerror', onError);
  const response = await page.goto(path, { waitUntil: 'domcontentloaded' });
  page.off('console', onConsole);
  page.off('pageerror', onError);
  const status = response?.status() ?? 0;
  if (status < 200 || status >= 400) problems.push(`status ${status}`);
  return problems;
}
