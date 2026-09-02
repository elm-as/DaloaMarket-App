import { chromium } from 'playwright';
import { mkdirSync } from 'fs';
import { resolve } from 'path';

const BASE = 'http://localhost:8081';
const OUT = resolve('../screenshots');
mkdirSync(OUT, { recursive: true });

const VIEWPORT = { width: 393, height: 851 };

const PAGES = [
  { name: '01-home',           path: '/' },
  { name: '02-search',         path: '/(tabs)/search' },
  { name: '03-cart',           path: '/(tabs)/cart' },
  { name: '04-orders',         path: '/(tabs)/orders' },
  { name: '05-profile',        path: '/(tabs)/profile' },
  { name: '06-listing-create', path: '/listing/create' },
  { name: '07-checkout',       path: '/checkout' },
  { name: '08-auth-login',     path: '/auth/login' },
  { name: '09-auth-register',  path: '/auth/register' },
  { name: '10-chat-list',      path: '/chat' },
  { name: '11-favorites',      path: '/favorites' },
  { name: '12-settings',       path: '/settings' },
  { name: '13-become-pro',     path: '/pro/become-pro' },
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
    console.log(`→ ${page.name}`);
    try {
      await tab.goto(`${BASE}${page.path}`, { waitUntil: 'networkidle', timeout: 15000 });
      await tab.waitForTimeout(2500);
      await tab.screenshot({ path: `${OUT}/${page.name}.png` });
      console.log(`  ✓`);
    } catch (e) {
      console.log(`  ✗ ${e.message.slice(0, 80)}`);
      try { await tab.screenshot({ path: `${OUT}/${page.name}.png` }); } catch {}
    }
    await tab.close();
  }

  await browser.close();
  console.log('\nDone — screenshots in', OUT);
})();
