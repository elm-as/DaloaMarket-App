import { chromium } from 'playwright';
import { mkdirSync } from 'fs';
import { resolve } from 'path';

const OUT = resolve('../screenshots');
mkdirSync(OUT, { recursive: true });

const LISTING_ID = 'b9989586-e2ed-4896-8826-6b88194cbe2d';
const VIEWPORT = { width: 393, height: 851 };

(async () => {
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({
    viewport: VIEWPORT,
    deviceScaleFactor: 2,
    userAgent: 'Mozilla/5.0 (Linux; Android 12; Pixel 6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/112.0.0.0 Mobile Safari/537.36',
  });

  const tab = await ctx.newPage();

  // Website listing detail
  console.log('→ web listing detail');
  await tab.goto(`https://daloamarket.com/listings/${LISTING_ID}`, { waitUntil: 'networkidle', timeout: 20000 });
  await tab.waitForTimeout(3000);
  await tab.screenshot({ path: `${OUT}/web-detail-top.png` });

  await tab.evaluate(() => window.scrollBy(0, 500));
  await tab.waitForTimeout(800);
  await tab.screenshot({ path: `${OUT}/web-detail-middle.png` });

  await tab.evaluate(() => window.scrollBy(0, 600));
  await tab.waitForTimeout(800);
  await tab.screenshot({ path: `${OUT}/web-detail-bottom.png` });
  console.log('  ✓ detail saved');

  // Website home
  console.log('→ web home');
  const tab2 = await ctx.newPage();
  await tab2.goto('https://daloamarket.com', { waitUntil: 'networkidle', timeout: 20000 });
  await tab2.waitForTimeout(3000);
  await tab2.screenshot({ path: `${OUT}/web-home.png` });
  console.log('  ✓ home saved');

  await browser.close();
  console.log('Done.');
})();
