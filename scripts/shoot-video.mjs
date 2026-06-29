import { chromium } from 'playwright';
const base = 'http://localhost:4321';
const browser = await chromium.launch();

async function gotoRetry(page, path) {
  for (let i = 0; i < 25; i++) {
    try { await page.goto(base + path, { waitUntil: 'load', timeout: 8000 }); return; }
    catch { await page.waitForTimeout(700); }
  }
}

// Article video embed: placeholder -> click -> iframe must be created.
async function video(name, path, provider, width) {
  const page = await browser.newPage({ viewport: { width, height: 1000 }, deviceScaleFactor: 1 });
  await gotoRetry(page, path);
  await page.waitForTimeout(500);
  const fig = page.locator(`.consent-embed[data-provider="${provider}"]`).first();
  await fig.scrollIntoViewIfNeeded();
  await page.waitForTimeout(400);
  await fig.screenshot({ path: `shots/video-${name}-placeholder.png` });

  const before = await page.locator('iframe').count();
  await fig.locator('.ce-load').click();
  await fig.locator('iframe').waitFor({ state: 'attached', timeout: 8000 });
  const src = await fig.locator('iframe').getAttribute('src');
  const after = await page.locator('iframe').count();
  console.log(`  ${name} (${provider}): iframes ${before}->${after}, created src=${src}`);
  await page.waitForTimeout(1500);
  await fig.scrollIntoViewIfNeeded();
  await fig.screenshot({ path: `shots/video-${name}-loaded.png` });
  await page.close();
}

// Regression: /kontakt map still gates + loads via the now-global controller.
async function maps() {
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 }, deviceScaleFactor: 1 });
  await gotoRetry(page, '/kontakt');
  await page.waitForTimeout(500);
  const fig = page.locator('.consent-embed[data-provider="maps"]').first();
  await fig.scrollIntoViewIfNeeded();
  await fig.locator('.ce-load').click();
  await fig.locator('iframe').waitFor({ state: 'attached', timeout: 8000 });
  console.log('  kontakt maps: iframe created OK (no regression)');
  await page.close();
}

await video('zahnarztangst', '/ratgeber/zahnarztangst-verstehen-und-endlich-besiegen', 'youtube', 1440);
await video('mundgeruch', '/ratgeber/mundgeruch', 'vimeo', 390);
await maps();
await browser.close();
console.log('DONE');
