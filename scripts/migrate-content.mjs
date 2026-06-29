// Migrate WordPress posts -> editable Markdown (src/content/ratgeber/<slug>.md)
// and comments -> src/data/comments.json (threaded, with Dr replies).
// Image URLs rewritten to local 1:1 paths. Run: node scripts/migrate-content.mjs
import fs from 'node:fs';
import { htmlToMarkdown } from './lib/preprocess-wp-dom.mjs';

const BASE = 'https://dr-ehrlichmann.de';
// --out <dir> writes to a temp dir (for diffing) and skips comments.json
const outArg = process.argv.indexOf('--out');
const OUT = outArg >= 0 ? process.argv[outArg + 1] : '';
const RATGEBER_DIR = OUT ? `${OUT}/ratgeber` : 'src/content/ratgeber';

const localize = (html) =>
  html
    .replaceAll('https://dr-ehrlichmann.de', '')
    .replaceAll('http://dr-ehrlichmann.de', '')
    .replaceAll('//dr-ehrlichmann.de', '');

const ENT = {
  '&amp;': '&', '&lt;': '<', '&gt;': '>', '&quot;': '"', '&#039;': "'", '&#39;': "'",
  '&#8217;': '’', '&#8216;': '‘', '&#8220;': '“', '&#8221;': '”', '&#8211;': '–', '&#8212;': '—',
  '&hellip;': '…', '&nbsp;': ' ', '&auml;': 'ä', '&ouml;': 'ö', '&uuml;': 'ü',
  '&Auml;': 'Ä', '&Ouml;': 'Ö', '&Uuml;': 'Ü', '&szlig;': 'ß',
};
const decode = (s) =>
  s.replace(/&[a-z]+;|&#0?39;/gi, (m) => ENT[m] ?? m).replace(/&#(\d+);/g, (_, n) => String.fromCharCode(+n));
const strip = (s) => decode(s.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim());
const y = (s) => JSON.stringify(s);

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

// ---- POSTS ----
const posts = await getAll('posts?_embed');
fs.mkdirSync(RATGEBER_DIR, { recursive: true });
const index = [];
const cats = new Map();
for (const p of posts) {
  const slug = p.slug;
  const pathName = new URL(p.link).pathname.replace(/\/$/, '');
  const terms = (p._embedded && p._embedded['wp:term'] && p._embedded['wp:term'][0]) || [];
  const cat = terms.find((t) => t.taxonomy === 'category') || terms[0] || { name: 'Praxiswissen', slug: 'praxiswissen' };
  const catName = decode(cat.name);
  cats.set(cat.slug, catName);
  const fm = p._embedded && p._embedded['wp:featuredmedia'] && p._embedded['wp:featuredmedia'][0];
  const hero = fm && fm.source_url ? localize(fm.source_url) : '';
  const heroAlt = fm ? strip(fm.alt_text || '') : '';
  const title = strip(p.title.rendered);
  const desc = strip(p.excerpt.rendered).slice(0, 250).replace(/\s+\S*$/, '');
  const md = htmlToMarkdown(p.content.rendered);
  const words = md.split(/\s+/).length;
  const rt = `${Math.max(2, Math.round(words / 200))} Min. Lesezeit`;
  const fmYaml = [
    '---',
    `title: ${y(title)}`,
    `description: ${y(desc)}`,
    `category: ${y(catName)}`,
    `categorySlug: ${y(cat.slug)}`,
    `date: ${p.date.slice(0, 10)}`,
    `updated: ${p.modified.slice(0, 10)}`,
    hero ? `hero: ${y(hero)}` : '',
    heroAlt ? `heroAlt: ${y(heroAlt)}` : '',
    `readingTime: ${y(rt)}`,
    `legacyId: ${p.id}`,
    '---',
  ].filter((x) => x !== '').join('\n');
  fs.writeFileSync(`${RATGEBER_DIR}/${slug}.md`, `${fmYaml}\n\n${md}\n`);
  index.push({ slug, path: pathName, cat: catName, catSlug: cat.slug });
}
console.log(`posts written: ${posts.length}`);
console.table(index);
console.log('THEMA categories (slug -> name):');
console.table([...cats].map(([slug, name]) => ({ slug, name })));

// ---- COMMENTS (skipped in --out/temp mode) ----
if (!OUT) {
  const comments = await getAll('comments?');
  const byPost = {};
  for (const c of comments) {
    (byPost[c.post] = byPost[c.post] || []).push({
      id: c.id,
      parent: c.parent,
      author: strip(c.author_name),
      date: c.date.slice(0, 10),
      isPraxis: /ehrlichmann/i.test(c.author_name),
      text: strip(localize(c.content.rendered)),
    });
  }
  fs.mkdirSync('src/data', { recursive: true });
  fs.writeFileSync('src/data/comments.json', JSON.stringify(byPost, null, 2));
  console.log(`comments: ${comments.length} across ${Object.keys(byPost).length} posts`);
}
