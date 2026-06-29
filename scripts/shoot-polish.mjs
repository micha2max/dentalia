import { chromium } from 'playwright';
const base = 'http://localhost:4321';
const browser = await chromium.launch();
async function go(page, path) {
  for (let i = 0; i < 25; i++) { try { await page.goto(base + path, { waitUntil: 'load', timeout: 8000 }); return; } catch { await page.waitForTimeout(700); } }
}
async function shotEl(page, sel, name) {
  const el = page.locator(sel).first();
  if (await el.count() === 0) { console.log('  MISSING', sel); return; }
  await el.scrollIntoViewIfNeeded(); await page.waitForTimeout(250);
  await el.screenshot({ path: `shots/${name}.png` });
  console.log('  shot', name);
}

// home hero (desktop + mobile)
for (const [w, tag] of [[1440, 'desktop'], [390, 'mobile']]) {
  const p = await browser.newPage({ viewport: { width: w, height: 900 } });
  await go(p, '/'); await p.waitForTimeout(500);
  await shotEl(p, '.hero', `polish-hero-${tag}`);
  await p.close();
}

// article blocks (karies-behandeln) desktop
{
  const p = await browser.newPage({ viewport: { width: 1280, height: 1000 } });
  await go(p, '/ratgeber/karies-behandeln'); await p.waitForTimeout(500);
  for (const [sel, name] of [
    ['.answer-capsule', 'polish-capsule'],
    ['.callout--tip', 'polish-callout-tip'],
    ['.podcast', 'polish-podcast'],
    ['.expert-qa', 'polish-expertqa'],
    ['.data-table', 'polish-table'],
    ['.cta-pair', 'polish-cta'],
    ['.qa-group', 'polish-qa'],
    ['.icon-list', 'polish-iconlist'],
  ]) await shotEl(p, sel, name);
  await p.close();
}

// callouts variety (zahnarztangst has many tones) + figure alignment
{
  const p = await browser.newPage({ viewport: { width: 1280, height: 1000 } });
  await go(p, '/ratgeber/kreidezaehne-erkennen-und-behandeln'); await p.waitForTimeout(500);
  await shotEl(p, '.article-body figure', 'polish-figure');
  await shotEl(p, '.callout--warning', 'polish-callout-warning');
  await p.close();
}

// fragen accordions (mobile)
{
  const p = await browser.newPage({ viewport: { width: 390, height: 900 } });
  await go(p, '/fragen'); await p.waitForTimeout(500);
  await shotEl(p, '.qa-group', 'polish-qa-mobile');
  await p.close();
}
await browser.close();
console.log('DONE');
