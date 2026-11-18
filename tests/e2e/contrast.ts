import { expect, type Page } from '@playwright/test';

export async function assertLightControls(page: Page) {
  const scheme = await page.evaluate(() => getComputedStyle(document.documentElement).colorScheme);
  expect(scheme, 'page color-scheme').not.toMatch(/dark/);
  const failures = await page.evaluate(() => {
    function parse(color: string) {
      const match = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/);
      if (!match) return null;
      return { r: Number(match[1]), g: Number(match[2]), b: Number(match[3]), a: match[4] === undefined ? 1 : Number(match[4]) };
    }
    function composite(front: { r: number; g: number; b: number; a: number }, back: { r: number; g: number; b: number; a: number }) {
      const a = front.a + back.a * (1 - front.a);
      if (a === 0) return { r: 255, g: 255, b: 255, a: 1 };
      return {
        r: Math.round((front.r * front.a + back.r * back.a * (1 - front.a)) / a),
        g: Math.round((front.g * front.a + back.g * back.a * (1 - front.a)) / a),
        b: Math.round((front.b * front.a + back.b * back.a * (1 - front.a)) / a),
        a,
      };
    }
    function backdrop(el: Element) {
      const layers: { r: number; g: number; b: number; a: number }[] = [];
      let node: Element | null = el.parentElement;
      while (node) {
        const color = parse(getComputedStyle(node).backgroundColor);
        if (color && color.a > 0) layers.push(color);
        node = node.parentElement;
      }
      let acc = { r: 255, g: 255, b: 255, a: 1 };
      for (let index = layers.length - 1; index >= 0; index -= 1) acc = composite(layers[index], acc);
      return acc;
    }
    function channel(value: number) {
      const s = value / 255;
      return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
    }
    function ratio(a: { r: number; g: number; b: number }, b: { r: number; g: number; b: number }) {
      const lum = (c: { r: number; g: number; b: number }) => 0.2126 * channel(c.r) + 0.7152 * channel(c.g) + 0.0722 * channel(c.b);
      const x = lum(a);
      const y = lum(b);
      return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
    }
    const failures: string[] = [];
    const seen = new Set<Element>();
    function check(node: HTMLElement, text: string) {
      if (seen.has(node) || !text.trim()) return;
      const style = getComputedStyle(node);
      if (style.display === 'none' || style.visibility === 'hidden' || Number(style.opacity) === 0) return;
      const rect = node.getBoundingClientRect();
      if (rect.width < 2 || rect.height < 2) return;
      const control = node.closest('button, input, textarea, select, a');
      if (!control) return;
      seen.add(node);
      const fg = parse(style.color);
      if (!fg) return;
      const stack = document.elementsFromPoint(rect.left + rect.width / 2, rect.top + rect.height / 2);
      const layers: { r: number; g: number; b: number; a: number }[] = [];
      for (const el of stack) {
        if (el === node) continue;
        const color = parse(getComputedStyle(el).backgroundColor);
        if (color && color.a > 0.2) layers.push(color);
      }
      let bg = { r: 255, g: 255, b: 255, a: 1 };
      for (let index = layers.length - 1; index >= 0; index -= 1) bg = composite(layers[index], bg);
      const own = parse(style.backgroundColor);
      if (own && own.a > 0.2) bg = composite(own, bg);
      const paint = composite(fg, bg);
      const score = ratio(paint, bg);
      const size = parseFloat(style.fontSize);
      const weight = Number(style.fontWeight) || 400;
      const large = size >= 24 || (weight >= 700 && size >= 18.66);
      const needed = large ? 3 : 4.5;
      if (score + 0.05 < needed) {
        failures.push(`${text.trim().slice(0, 40)} ${score.toFixed(2)}:1 on ${node.tagName.toLowerCase()} (${style.color} / ${style.backgroundColor})`);
      }
    }
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    let current = walker.nextNode();
    while (current) {
      if (current.parentElement) check(current.parentElement, current.textContent ?? '');
      current = walker.nextNode();
    }
    document.querySelectorAll('input, textarea').forEach((node) => {
      if (node instanceof HTMLInputElement || node instanceof HTMLTextAreaElement) {
        if (!node.value && node.placeholder) check(node, node.placeholder);
      }
    });
    return failures.slice(0, 12);
  });
  expect(failures, failures.join('\n')).toEqual([]);
}
