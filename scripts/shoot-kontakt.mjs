import { chromium } from 'playwright';
const base = 'http://localhost:4321';
const browser = await chromium.launch();

async function shoot(name, width) {
  const page = await browser.newPage({ viewport: { width, height: 1000 }, deviceScaleFactor: 1 });
  for (let i = 0; i < 25; i++) {
    try { await page.goto(base + '/kontakt', { waitUntil: 'load', timeout: 8000 }); break; }
    catch { await page.waitForTimeout(700); }
  }
  await page.waitForTimeout(600);

  const anf = page.locator('#anfahrt');
  await anf.scrollIntoViewIfNeeded();
  await page.waitForTimeout(400);
  await anf.screenshot({ path: `shots/kontakt-anfahrt-${name}.png` });
  console.log('placeholder shot', name);

  // Functional test of the consent gate: clicking must CREATE the iframe.
  const btn = page.locator('.consent-embed[data-provider="maps"] .ce-load');
  await btn.click();
  await page.waitForSelector('.consent-embed[data-provider="maps"] iframe', { timeout: 8000 });
  const iframeSrc = await page.getAttribute('.consent-embed[data-provider="maps"] iframe', 'src');
  console.log('  iframe created on click, src=', iframeSrc);
  await page.waitForTimeout(2500);
  await anf.scrollIntoViewIfNeeded();
  await anf.screenshot({ path: `shots/kontakt-anfahrt-${name}-loaded.png` });
  console.log('loaded shot', name);
  await page.close();
}

await shoot('desktop', 1440);
await shoot('mobile', 390);
await browser.close();
console.log('DONE');
