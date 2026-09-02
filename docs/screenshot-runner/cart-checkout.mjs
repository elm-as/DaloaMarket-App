import { chromium } from 'playwright';
import { mkdirSync } from 'fs';
import { resolve } from 'path';

const BASE = 'http://localhost:8081';
const OUT = resolve('../screenshots');
mkdirSync(OUT, { recursive: true });

(async () => {
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({
    viewport: { width: 393, height: 852 },
    deviceScaleFactor: 2,
    userAgent: 'Mozilla/5.0 (Linux; Android 12; Pixel 6) AppleWebKit/537.36',
  });

  // Cart vide
  const tab = await ctx.newPage();
  await tab.goto(`${BASE}/cart`, { waitUntil: 'networkidle', timeout: 20000 });
  await tab.waitForTimeout(3000);
  await tab.screenshot({ path: `${OUT}/cart-empty.png` });

  // Checkout
  const tab2 = await ctx.newPage();
  await tab2.goto(`${BASE}/checkout?listingId=b9989586-e2ed-4896-8826-6b88194cbe2d&quantity=1`, { waitUntil: 'networkidle', timeout: 20000 });
  await tab2.waitForTimeout(4000);
  await tab2.screenshot({ path: `${OUT}/checkout-top.png` });

  // Checkout bas (tall viewport)
  const ctx2 = await browser.newContext({
    viewport: { width: 393, height: 3200 },
    deviceScaleFactor: 2,
    userAgent: 'Mozilla/5.0 (Linux; Android 12; Pixel 6) AppleWebKit/537.36',
  });
  const tab3 = await ctx2.newPage();
  await tab3.goto(`${BASE}/checkout?listingId=b9989586-e2ed-4896-8826-6b88194cbe2d&quantity=1`, { waitUntil: 'networkidle', timeout: 20000 });
  await tab3.waitForTimeout(4000);
  await tab3.screenshot({ path: `${OUT}/checkout-full.png`, clip: { x: 0, y: 0, width: 393, height: 1400 } });

  console.log('Done.');
  await browser.close();
})();
