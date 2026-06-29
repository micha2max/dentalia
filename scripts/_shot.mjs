import { chromium } from 'playwright';
const out = process.argv[2] || 'shot.png';
const url = process.argv[3] || 'http://localhost:4321/';
const sel = process.argv[4];
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1366, height: 1000 }, deviceScaleFactor: 2 });
await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
if (sel) { const el = await page.$(sel); if (el) { await el.screenshot({ path: out }); } else { console.log('selector not found:', sel); await page.screenshot({ path: out, fullPage: true }); } }
else { await page.screenshot({ path: out, fullPage: true }); }
await browser.close();
console.log('shot saved', out);
