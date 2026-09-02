import { chromium } from 'playwright';
import { mkdirSync } from 'fs';
import { resolve } from 'path';

const BASE = 'http://localhost:8081';
const OUT = resolve('../screenshots');
mkdirSync(OUT, { recursive: true });

const VIEWPORT = { width: 393, height: 851 };

const PAGES = [
  { path: '/chat', name: 'chat' },
  { path: '/favorites', name: 'favorites' },
  { path: '/settings', name: 'settings' },
];

(async () => {
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({
    viewport: VIEWPORT,
    deviceScaleFactor: 2,
    userAgent: 'Mozilla/5.0 (Linux; Android 12; Pixel 6) AppleWebKit/537.36',
  });

  for (const page of PAGES) {
    const tab = await ctx.newPage();
    await tab.goto(`${BASE}${page.path}`, { waitUntil: 'networkidle', timeout: 20000 });
    await tab.waitForTimeout(3000);
    console.log(`→ ${page.name}`);
    await tab.screenshot({ path: `${OUT}/${page.name}-hero.png` });
    await tab.close();
  }

  await browser.close();
  console.log('Done.');
})();
