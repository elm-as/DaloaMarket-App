import { chromium } from 'playwright';
import { mkdirSync } from 'fs';
import { resolve } from 'path';

const BASE = 'http://localhost:8081';
const OUT = resolve('../screenshots');
mkdirSync(OUT, { recursive: true });

const LISTING_ID = 'b9989586-e2ed-4896-8826-6b88194cbe2d';

(async () => {
  const browser = await chromium.launch({ headless: true });

  // Viewport très haut pour tout voir
  const ctx = await browser.newContext({
    viewport: { width: 393, height: 3200 },
    deviceScaleFactor: 2,
    userAgent: 'Mozilla/5.0 (Linux; Android 12; Pixel 6) AppleWebKit/537.36',
  });

  const tab = await ctx.newPage();
  await tab.goto(`${BASE}/listing/${LISTING_ID}`, { waitUntil: 'networkidle', timeout: 20000 });
  await tab.waitForTimeout(6000);

  await tab.screenshot({ path: `${OUT}/detail-full.png`, fullPage: false });
  console.log('→ full page captured');

  await tab.close();
  await browser.close();
  console.log('Done.');
})();
