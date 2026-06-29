// Migrate WordPress pages -> Markdown (src/content/pages/<flat>.md) with their
// full URL path preserved 1:1. Excludes van Giersbergen, home, and the form
// pages (kontakt/terminanfrage are dedicated form templates).
import fs from 'node:fs';
import { htmlToMarkdown } from './lib/preprocess-wp-dom.mjs';

const BASE = 'https://dr-ehrlichmann.de';
// --out <dir> writes to a temp dir (for diffing) instead of src/content/pages
const outArg = process.argv.indexOf('--out');
const OUT = outArg >= 0 ? process.argv[outArg + 1] : '';
const PAGES_DIR = OUT ? `${OUT}/pages` : 'src/content/pages';

// Localize every internal link/asset (domain -> root-relative) and drop trailing
// slashes on internal links so they match our trailingSlash:'never' routes.
const localize = (html) =>
  html
    .replaceAll('https://dr-ehrlichmann.de', '')
    .replaceAll('http://dr-ehrlichmann.de', '')
    .replaceAll('//dr-ehrlichmann.de', '');
const ENT = { '&amp;': '&', '&lt;': '<', '&gt;': '>', '&quot;': '"', '&#039;': "'", '&#8217;': '’', '&#8211;': '–', '&#8212;': '—', '&hellip;': '…', '&nbsp;': ' ', '&auml;': 'ä', '&ouml;': 'ö', '&uuml;': 'ü', '&szlig;': 'ß' };
const decode = (s) => s.replace(/&[a-z]+;|&#0?39;/gi, (m) => ENT[m] ?? m).replace(/&#(\d+);/g, (_, n) => String.fromCharCode(+n));
const strip = (s) => decode(s.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim());
const y = (s) => JSON.stringify(s);

const EXCLUDE_SLUG = new Set(['gabriele-van-giersbergen', 'kontakt', 'terminanfrage', '404-error-page', 'startseite', 'home']);

async function getAll(ep) {
  const all = [];
  let page = 1;
  while (true) {
    const r = await fetch(`${BASE}/wp-json/wp/v2/${ep}&per_page=100&page=${page}`);
    if (!r.ok) break;
    const arr = await r.json();
    if (!Array.isArray(arr) || !arr.length) break;
    all.push(...arr);
    const tp = +(r.headers.get('x-wp-totalpages') || 1);
    if (page >= tp) break;
    page++;
  }
  return all;
}

const pages = await getAll('pages?_embed');
const byId = new Map(pages.map((p) => [p.id, p]));
fs.mkdirSync(PAGES_DIR, { recursive: true });

const out = [];
for (const p of pages) {
  const path = new URL(p.link).pathname.replace(/\/$/, '') || '/';
  if (path === '/' || /van-giersbergen|gabriele/i.test(path)) continue;
  if (EXCLUDE_SLUG.has(p.slug)) continue;

  const parent = p.parent ? byId.get(p.parent) : null;
  const fm = p._embedded && p._embedded['wp:featuredmedia'] && p._embedded['wp:featuredmedia'][0];
  const hero = fm && fm.source_url ? localize(fm.source_url) : '';
  const title = strip(p.title.rendered);
  const desc = strip(p.excerpt.rendered).slice(0, 260).replace(/\s+\S*$/, '');
  let md = htmlToMarkdown(p.content.rendered);
  // strip van Giersbergen mentions defensively
  md = md.replace(/.*van[- ]?Giersbergen.*\n?/gi, '');

  const flat = path.replace(/^\//, '').replace(/\//g, '__') || 'index';
  const fmYaml = [
    '---',
    `title: ${y(title)}`,
    desc ? `description: ${y(desc)}` : '',
    `path: ${y(path)}`,
    parent ? `parentTitle: ${y(strip(parent.title.rendered))}` : '',
    parent ? `parentPath: ${y(new URL(parent.link).pathname.replace(/\/$/, ''))}` : '',
    hero ? `hero: ${y(hero)}` : '',
    `legacyId: ${p.id}`,
    '---',
  ].filter((x) => x !== '').join('\n');
  fs.writeFileSync(`${PAGES_DIR}/${flat}.md`, `${fmYaml}\n\n${md}\n`);
  out.push({ path, title: title.slice(0, 40), parent: parent ? parent.slug : '' });
}
console.log(`pages written: ${out.length} (of ${pages.length} total)`);
console.table(out);
