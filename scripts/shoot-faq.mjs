import { chromium } from 'playwright';
const base = 'http://localhost:4321';
const browser = await chromium.launch();

async function shoot(name, width) {
  const page = await browser.newPage({ viewport: { width, height: 1000 }, deviceScaleFactor: 1 });
  for (let i = 0; i < 25; i++) {
    try { await page.goto(base + '/', { waitUntil: 'load', timeout: 8000 }); break; }
    catch { await page.waitForTimeout(700); }
  }
  await page.waitForTimeout(600);

  const faq = page.locator('#faq');
  await faq.scrollIntoViewIfNeeded();
  await page.waitForTimeout(500);
  await faq.screenshot({ path: `shots/faq-${name}.png` });
  console.log('shot', name);

  // Functional: first item open by default, others closed; clicking toggles.
  const items = page.locator('.faq-item');
  const count = await items.count();
  const firstOpen = await items.nth(0).evaluate((el) => el.open);
  const thirdClosed = await items.nth(2).evaluate((el) => !el.open);
  await items.nth(2).locator('summary').click();
  await page.waitForTimeout(350);
  const thirdNowOpen = await items.nth(2).evaluate((el) => el.open);
  console.log(`  items=${count} firstOpen=${firstOpen} thirdClosed=${thirdClosed} thirdOpensOnClick=${thirdNowOpen}`);
  await faq.scrollIntoViewIfNeeded();
  await faq.screenshot({ path: `shots/faq-${name}-toggled.png` });
  await page.close();
}

await shoot('desktop', 1440);
await shoot('mobile', 390);
await browser.close();
console.log('DONE');
