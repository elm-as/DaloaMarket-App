import { chromium } from 'playwright';
import { mkdirSync } from 'fs';
import { resolve } from 'path';

const BASE = 'http://localhost:8081';
const OUT = resolve('../screenshots');
mkdirSync(OUT, { recursive: true });

const LISTING_ID = 'b9989586-e2ed-4896-8826-6b88194cbe2d';
const VIEWPORT = { width: 393, height: 851 };

(async () => {
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({
    viewport: VIEWPORT,
    deviceScaleFactor: 2,
    userAgent: 'Mozilla/5.0 (Linux; Android 12; Pixel 6) AppleWebKit/537.36',
  });

  const tab = await ctx.newPage();
  await tab.goto(`${BASE}/listing/${LISTING_ID}`, { waitUntil: 'networkidle', timeout: 20000 });
  await tab.waitForTimeout(5000);

  // Scroll via the RN web ScrollView container (first overflow:auto div)
  const scrollBy = async (px) => {
    await tab.evaluate((amount) => {
      const el = document.querySelector('[data-testid="RCTScrollView"], [style*="overflow: scroll"], [style*="overflow-y: scroll"], [style*="overflow: auto"]');
      if (el) el.scrollTop += amount;
      else window.scrollBy(0, amount);
    }, px);
    await tab.waitForTimeout(500);
  };

  console.log('→ top');
  await tab.screenshot({ path: `${OUT}/detail-new-top.png` });

  await scrollBy(500);
  console.log('→ mid1 (description + trust badges)');
  await tab.screenshot({ path: `${OUT}/detail-new-mid1.png` });

  await scrollBy(600);
  console.log('→ mid2 (seller box)');
  await tab.screenshot({ path: `${OUT}/detail-new-mid2.png` });

  await scrollBy(800);
  console.log('→ bottom (reviews + footer)');
  await tab.screenshot({ path: `${OUT}/detail-new-bottom.png` });

  await tab.close();
  await browser.close();
  console.log('Done.');
})();
