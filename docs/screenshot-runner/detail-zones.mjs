import { chromium } from 'playwright';
import { mkdirSync } from 'fs';
import { resolve } from 'path';

const BASE = 'http://localhost:8081';
const OUT = resolve('../screenshots');
mkdirSync(OUT, { recursive: true });

const LISTING_ID = 'b9989586-e2ed-4896-8826-6b88194cbe2d';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({
    viewport: { width: 393, height: 3200 },
    deviceScaleFactor: 2,
    userAgent: 'Mozilla/5.0 (Linux; Android 12; Pixel 6) AppleWebKit/537.36',
  });

  const tab = await ctx.newPage();
  await tab.goto(`${BASE}/listing/${LISTING_ID}`, { waitUntil: 'networkidle', timeout: 20000 });
  await tab.waitForTimeout(6000);

  // Zone 1 : top info (prix + description + garanties)
  await tab.screenshot({
    path: `${OUT}/zone-top.png`,
    clip: { x: 0, y: 280, width: 393, height: 640 },
  });

  // Zone 2 : vendeur + avis
  await tab.screenshot({
    path: `${OUT}/zone-seller.png`,
    clip: { x: 0, y: 860, width: 393, height: 520 },
  });

  // Zone 3 : footer (tout en bas du viewport 3200)
  await tab.screenshot({
    path: `${OUT}/zone-footer.png`,
    clip: { x: 0, y: 3130, width: 393, height: 70 },
  });

  // Zone 4 : full page overview (crop top 400px)
  await tab.screenshot({
    path: `${OUT}/zone-overview.png`,
    clip: { x: 0, y: 0, width: 393, height: 3200 },
  });

  console.log('Done.');
  await browser.close();
})();
