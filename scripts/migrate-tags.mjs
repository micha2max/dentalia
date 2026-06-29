// Migrate WordPress post tags (Schlagwörter) -> src/data/tags.json.
// Same approach as comments.json: tags live in a data file keyed by the WP post
// id (= ratgeber `legacyId`), so the content .md files stay untouched and a
// re-migration of content never disturbs them. URLs preserved 1:1 as
// /schlagwort/<slug> (WP tag base "schlagwort"). Run: node scripts/migrate-tags.mjs
import fs from 'node:fs';

const BASE = 'https://dr-ehrlichmann.de';
const OUT = 'src/data/tags.json';

const ENT = { '&amp;': '&', '&#039;': "'", '&#39;': "'", '&#8211;': '–', '&#8217;': '’' };
const decode = (s) =>
  String(s || '').replace(/&[a-z]+;|&#0?39;/gi, (m) => ENT[m] ?? m).replace(/&#(\d+);/g, (_, n) => String.fromCharCode(+n));

// Display name: faithful WP name, but Title-Cased per word (incl. hyphen parts)
// so chips look clean ("zahngesundheit" -> "Zahngesundheit").
const titleCase = (s) =>
  decode(s)
    .split(' ')
    .map((w) => w.split('-').map((p) => (p ? p[0].toUpperCase() + p.slice(1) : p)).join('-'))
    .join(' ');

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

const rawTags = await getAll('tags?_fields=id,name,slug,count');
const posts = await getAll('posts?_fields=id,slug,tags');

// id -> {name, slug}; keep only tags actually used by >=1 post.
const byId = new Map(rawTags.map((t) => [t.id, { name: titleCase(t.name), slug: t.slug, count: t.count }]));

const byPost = {};       // legacyId -> [slug,...]
const used = new Set();  // tag ids referenced by at least one post
for (const p of posts) {
  const slugs = (p.tags || []).map((id) => byId.get(id)).filter(Boolean);
  if (!slugs.length) continue;
  byPost[String(p.id)] = slugs.map((t) => t.slug);
  for (const id of p.tags || []) if (byId.has(id)) used.add(id);
}

// Public tag list (only those with posts), sorted by count desc then name.
const tags = [...byId.entries()]
  .filter(([id, t]) => used.has(id) && t.count > 0)
  .map(([, t]) => ({ name: t.name, slug: t.slug, count: t.count }))
  .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name, 'de'));

fs.writeFileSync(OUT, JSON.stringify({ tags, byPost }, null, 2) + '\n');
console.log(`wrote ${OUT}: ${tags.length} tags, ${Object.keys(byPost).length} posts tagged`);
console.log(tags.map((t) => `  ${t.slug} (${t.count})`).join('\n'));
