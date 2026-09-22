import { chromium } from '@playwright/test';
import { mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const browser = await chromium.launch({ channel: 'msedge', headless: true });
const output = new URL('../test-results/visual/', import.meta.url);
await mkdir(output, { recursive: true });
for (const width of [390, 1440]) {
  const context = await browser.newContext({ viewport: { width, height: width < 600 ? 844 : 900 }, deviceScaleFactor: 1 });
  const page = await context.newPage();
  for (const [name, route] of [['learn', '/learn'], ['catalog', '/learn/flags'], ['detail', '/item/mexico-national-flag'], ['emblem', '/item/south-africa-coat-of-arms'], ['nature', '/item/uluru'], ['quiz', '/quiz/session?mode=flag&count=5&focus=mexico-national-flag']]) {
    await page.goto(`http://127.0.0.1:4173${route}`);
    await page.screenshot({ path: fileURLToPath(new URL(`${width}-${name}.png`, output)), fullPage: true });
  }
  await context.close();
}
await browser.close();
