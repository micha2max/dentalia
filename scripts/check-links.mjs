// Build-time internal-link checker. Crawls every dist/*.html, extracts internal
// href/src targets, and asserts each resolves to a real built file (respecting
// build.format:'file' => /foo -> dist/foo.html). Skips external URLs, #anchors,
// tel:/mailto:/data:, and the runtime /api/* form endpoints (served by a function).
// Run after `astro build`:  node scripts/check-links.mjs
import fs from 'node:fs';
import path from 'node:path';

const DIST = 'dist';
const htmlFiles = [];
(function walk(dir) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p);
    else if (e.name.endsWith('.html')) htmlFiles.push(p);
  }
})(DIST);

const exists = (rel) => {
  const clean = rel.split(/[#?]/)[0];
  const base = path.join(DIST, clean.replace(/^\//, ''));
  if (fs.existsSync(base) && fs.statSync(base).isFile()) return true;        // asset or /foo.html
  if (fs.existsSync(base + '.html')) return true;                            // /foo -> dist/foo.html
  if (fs.existsSync(path.join(base, 'index.html'))) return true;            // /foo -> dist/foo/index.html
  return false;
};

const SKIP = /^(https?:|tel:|mailto:|data:|javascript:|#|\/api\/)/i;
const broken = new Map(); // target -> Set(pages)

for (const file of htmlFiles) {
  const html = fs.readFileSync(file, 'utf8');
  const page = file.replace(/\\/g, '/');
  for (const m of html.matchAll(/\b(?:href|src)\s*=\s*"([^"]+)"/g)) {
    const url = m[1];
    if (!url || SKIP.test(url)) continue;
    if (!url.startsWith('/')) continue;              // only root-relative internal targets
    if (/\.html(?:[#?]|$)/.test(url)) {              // internal nav must be extensionless
      (broken.get(url) || broken.set(url, new Set()).get(url)).add(page + ' [.html link]');
      continue;
    }
    if (url !== '/' && url.endsWith('/')) {          // no trailing slash on internal nav
      (broken.get(url) || broken.set(url, new Set()).get(url)).add(page + ' [trailing slash]');
      continue;
    }
    if (!exists(url)) (broken.get(url) || broken.set(url, new Set()).get(url)).add(page);
  }
}

if (broken.size === 0) {
  console.log(`OK — checked ${htmlFiles.length} pages, no broken internal links.`);
  process.exit(0);
}
console.error(`BROKEN internal references (${broken.size} unique targets):`);
for (const [target, pages] of [...broken.entries()].sort()) {
  console.error(`  ${target}`);
  for (const p of [...pages].slice(0, 6)) console.error(`      <- ${p}`);
  if (pages.size > 6) console.error(`      ... +${pages.size - 6} more`);
}
process.exit(1);
