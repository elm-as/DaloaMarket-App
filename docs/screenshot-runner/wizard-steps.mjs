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

  const tab = await ctx.newPage();
  await tab.goto(`${BASE}/listing/create`, { waitUntil: 'networkidle', timeout: 20000 });
  await tab.waitForTimeout(4000);
  await tab.screenshot({ path: `${OUT}/wiz-s1.png` });

  // Fill title and go to step 2
  const inputs = await tab.$$('input');
  if (inputs[0]) {
    await inputs[0].click();
    await inputs[0].fill('iPhone 12 Pro Max 128Go Bleu');
  }
  await tab.waitForTimeout(400);
  const btns1 = await tab.$$('div[role="button"], button');
  for (const btn of btns1) {
    const t = await btn.textContent();
    if (t && t.trim().includes('Continuer')) { await btn.click(); break; }
  }
  await tab.waitForTimeout(2000);
  await tab.screenshot({ path: `${OUT}/wiz-s2.png` });

  // Fill price and go to step 3
  const inputs2 = await tab.$$('input');
  for (const inp of inputs2) {
    const placeholder = await inp.getAttribute('placeholder');
    if (placeholder && placeholder.includes('25000')) {
      await inp.click();
      await inp.fill('15000');
      break;
    }
  }
  await tab.waitForTimeout(400);
  const btns2 = await tab.$$('div[role="button"], button');
  for (const btn of btns2) {
    const t = await btn.textContent();
    if (t && t.trim().includes('Continuer')) { await btn.click(); break; }
  }
  await tab.waitForTimeout(2000);
  await tab.screenshot({ path: `${OUT}/wiz-s3.png` });

  // Go to step 4
  const btns3 = await tab.$$('div[role="button"], button');
  for (const btn of btns3) {
    const t = await btn.textContent();
    if (t && t.trim().includes('Continuer')) { await btn.click(); break; }
  }
  await tab.waitForTimeout(2000);
  await tab.screenshot({ path: `${OUT}/wiz-s4.png` });

  console.log('Done all 4 steps.');
  await browser.close();
})();
