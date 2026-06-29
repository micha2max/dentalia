// Visual check for the inline "Lesetipp" related-link blocks.
// Requires `npm run preview` running on :4321. Writes to shots/.
import { chromium } from 'playwright';
const base = 'http://localhost:4321';
const browser = await chromium.launch();

async function gotoRetry(page, path) {
  for (let i = 0; i < 30; i++) {
    try { await page.goto(base + path, { waitUntil: 'load', timeout: 8000 }); return; }
    catch { await page.waitForTimeout(700); }
  }
}

async function shot(name, path, width) {
  const page = await browser.newPage({ viewport: { width, height: 1100 }, deviceScaleFactor: 1 });
  await gotoRetry(page, path);
  await page.waitForTimeout(400);
  const n = await page.locator('.lesetipp').count();
  const lt = page.locator('.lesetipp').first();
  await lt.scrollIntoViewIfNeeded();
  await page.evaluate(() => window.scrollBy(0, -200)); // reveal some context above
  await page.waitForTimeout(300);
  await page.screenshot({ path: `shots/lesetipp-${name}-context.png` });
  await lt.screenshot({ path: `shots/lesetipp-${name}.png` });
  await lt.locator('.lesetipp-link').hover();
  await page.waitForTimeout(350);
  await lt.screenshot({ path: `shots/lesetipp-${name}-hover.png` });
  const title = await lt.locator('.lesetipp-title').first().innerText();
  console.log(`  ${name}: ${n} lesetipp on page; first title="${title}"`);
  await page.close();
}

await shot('mundgeruch', '/ratgeber/mundgeruch', 1440);
await shot('zahnwechsel', '/ratgeber/zahnwechsel', 1440);
await shot('mundgeruch-mobile', '/ratgeber/mundgeruch', 390);
await browser.close();
console.log('DONE');
