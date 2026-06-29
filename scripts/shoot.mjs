import { chromium } from 'playwright';
const base = 'http://localhost:4321';
const shots = [
  ['praxis-desktop', '/zahnarztpraxis', 1440],
  ['praxis-mobile', '/zahnarztpraxis', 390],
];
async function revealAll(page) {
  await page.evaluate(() => new Promise((resolve) => {
    let y = 0; const step = Math.round(window.innerHeight * 0.6);
    const iv = setInterval(() => {
      window.scrollTo(0, y); y += step;
      if (y >= document.body.scrollHeight) { clearInterval(iv); window.scrollTo(0, 0); resolve(); }
    }, 90);
  }));
  await page.waitForTimeout(700);
}
const browser = await chromium.launch();
for (const [name, path, width] of shots) {
  const page = await browser.newPage({ viewport: { width, height: 900 }, deviceScaleFactor: 1 });
  for (let i = 0; i < 25; i++) { try { await page.goto(base + path, { waitUntil: 'load', timeout: 8000 }); break; } catch { await page.waitForTimeout(700); } }
  await page.waitForTimeout(800);
  await revealAll(page);
  await page.screenshot({ path: `shots/${name}.png`, fullPage: true });
  console.log('shot', name);
  await page.close();
}
await browser.close();
console.log('DONE');
