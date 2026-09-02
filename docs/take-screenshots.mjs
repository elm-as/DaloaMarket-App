import { chromium } from 'playwright';
import { mkdirSync } from 'fs';

const BASE = 'http://localhost:8081';
const OUT = './docs/screenshots';
mkdirSync(OUT, { recursive: true });

// Simulate a Pixel 6 form factor
const VIEWPORT = { width: 393, height: 851 };

const PAGES = [
  { name: '01-home',          path: '/' },
  { name: '02-search',        path: '/(tabs)/search' },
  { name: '03-cart',          path: '/(tabs)/cart' },
  { name: '04-orders',        path: '/(tabs)/orders' },
  { name: '05-profile',       path: '/(tabs)/profile' },
  { name: '06-listing-detail', path: '/listing/a6dc49c1-52ce-4ef5-b1ed-24f2b1fd6ef5' },
  { name: '07-checkout',      path: '/checkout' },
  { name: '08-auth-login',    path: '/auth/login' },
  { name: '09-auth-register', path: '/auth/register' },
  { name: '10-chat-list',     path: '/chat' },
  { name: '11-favorites',     path: '/favorites' },
  { name: '12-seller-profile', path: '/seller/1' },
  { name: '13-settings',      path: '/settings' },
  { name: '14-become-pro',    path: '/pro/become-pro' },
  { name: '15-revenue',       path: '/pro/revenue' },
];

(async () => {
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({
    viewport: VIEWPORT,
    deviceScaleFactor: 2,
    userAgent: 'Mozilla/5.0 (Linux; Android 12; Pixel 6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/112.0.0.0 Mobile Safari/537.36',
  });

  for (const page of PAGES) {
    const tab = await ctx.newPage();
    console.log(`→ ${page.name}`);
    try {
      await tab.goto(`${BASE}${page.path}`, { waitUntil: 'networkidle', timeout: 15000 });
      await tab.waitForTimeout(2000);
      await tab.screenshot({ path: `${OUT}/${page.name}.png`, fullPage: false });
      console.log(`  ✓ saved`);
    } catch (e) {
      console.log(`  ✗ ${e.message}`);
      // take whatever is rendered
      try {
        await tab.screenshot({ path: `${OUT}/${page.name}.png`, fullPage: false });
      } catch {}
    }
    await tab.close();
  }

  await browser.close();
  console.log('\nDone.');
})();
