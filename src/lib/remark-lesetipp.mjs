// remark plugin: inline "Lesetipp" contextual related-article links inside
// Ratgeber posts. Mirrors the live WordPress site's "Inline Related Posts"
// plugin (which auto-injects reading tips into the body) — re-implemented at
// build time in our brand style. Also REPAIRS the handful of manually-authored
// Lesetipp blocks that the WP export broke into literal "[ … ](/ratgeber/…)"
// bracket text. Content .md files are never modified; this only edits the mdast.
import fs from 'node:fs';
import path from 'node:path';

const RATGEBER_DIR = path.join('src', 'content', 'ratgeber');
let INDEX = null;

// Lightweight index of all Ratgeber posts (slug, title, categorySlug), built
// once from the frontmatter on disk and cached for the whole build.
function buildIndex() {
  if (INDEX) return INDEX;
  INDEX = [];
  let files = [];
  try { files = fs.readdirSync(RATGEBER_DIR); } catch { files = []; }
  for (const f of files) {
    if (!f.endsWith('.md')) continue;
    const slug = f.slice(0, -3);
    let src = '';
    try { src = fs.readFileSync(path.join(RATGEBER_DIR, f), 'utf8'); } catch { continue; }
    const end = src.indexOf('\n---', 3);
    const fm = end > 0 ? src.slice(0, end) : src.slice(0, 800);
    const title = (fm.match(/^title:\s*"?(.*?)"?\s*$/m) || [])[1] || slug;
    const categorySlug = (fm.match(/^categorySlug:\s*"?(.*?)"?\s*$/m) || [])[1] || '';
    INDEX.push({ slug, title: title.replace(/\\"/g, '"'), categorySlug });
  }
  return INDEX;
}

const esc = (s) =>
  String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

function lesetippNode(slug, title) {
  const value =
    `<aside class="lesetipp"><a class="lesetipp-link" href="/ratgeber/${slug}">` +
    `<span class="lesetipp-kicker">Lesetipp</span>` +
    `<span class="lesetipp-title">${esc(title)}</span>` +
    `<svg class="lesetipp-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>` +
    `</a></aside>`;
  return { type: 'html', value };
}

function nodeText(node) {
  if (!node) return '';
  if (node.value != null && (node.type === 'text' || node.type === 'inlineCode' || node.type === 'html')) return node.value;
  return (node.children || []).map(nodeText).join('');
}

function collectLinkedSlugs(node, set) {
  if (!node) return;
  if (node.type === 'link') {
    const m = String(node.url || '').match(/^\/ratgeber\/([^/#?]+)/);
    if (m) set.add(m[1]);
  }
  (node.children || []).forEach((c) => collectLinkedSlugs(c, set));
}

function selfSlugFromFile(file) {
  const p = String((file && (file.path || (file.history && file.history[0]))) || '').replace(/\\/g, '/');
  const m = p.match(/\/content\/ratgeber\/([^/]+)\.md$/);
  return m ? m[1] : '';
}

export default function remarkLesetipp() {
  return (tree, file) => {
    const selfSlug = selfSlugFromFile(file);
    if (!selfSlug) return; // only Ratgeber articles, never the static pages
    const ch = tree.children;
    if (!Array.isArray(ch)) return;

    const index = buildIndex();
    const self = index.find((e) => e.slug === selfSlug);
    const catSlug = (self && self.categorySlug) || (file?.data?.astro?.frontmatter?.categorySlug) || '';

    const linked = new Set([selfSlug]);
    collectLinkedSlugs(tree, linked);

    // --- 1) Repair + restyle manually-authored (export-broken) Lesetipp blocks.
    // Shape in the migrated md: paragraph "[" · "Lesetipp:" · "<title>" · "](/ratgeber/<slug>)"
    let hasManual = false;
    for (let i = 0; i < ch.length; i++) {
      if (ch[i].type !== 'paragraph' || nodeText(ch[i]).trim() !== '[') continue;
      let j = -1, url = '';
      for (let k = i + 1; k <= Math.min(i + 5, ch.length - 1); k++) {
        const mm = nodeText(ch[k]).trim().match(/^\]\((\/ratgeber\/[^\s)]+)\)$/);
        if (mm) { j = k; url = mm[1]; break; }
      }
      if (j === -1) continue;
      const slug = (url.match(/^\/ratgeber\/([^/#?]+)/) || [])[1] || '';
      const between = ch.slice(i + 1, j).map(nodeText).map((t) => t.trim())
        .filter((t) => t && !/^Lesetipp:?$/i.test(t)).join(' ').trim();
      const title = (index.find((e) => e.slug === slug) || {}).title || between || slug;
      ch.splice(i, j - i + 1, lesetippNode(slug, title));
      linked.add(slug);
      hasManual = true;
    }
    if (hasManual) return; // author placed them on purpose — don't also auto-insert

    // --- 2) Auto-insert contextual Lesetipp links (same Thema first). ---
    const pool = [
      ...index.filter((e) => !linked.has(e.slug) && e.categorySlug === catSlug),
      ...index.filter((e) => !linked.has(e.slug) && e.categorySlug !== catSlug),
    ];
    if (!pool.length) return;

    // insertion points (insert BEFORE these indices), spread through the body
    const h2 = [];
    for (let i = 0; i < ch.length; i++) if (ch[i].type === 'heading' && ch[i].depth === 2) h2.push(i);
    const points = [];
    for (let k = 1; k < h2.length && points.length < 2; k += 2) points.push(h2[k]); // before 2nd, 4th H2
    if (!points.length) {
      // fallback for articles with <2 sections: after the 3rd (or last) real paragraph
      const paras = [];
      for (let i = 0; i < ch.length; i++) if (ch[i].type === 'paragraph' && nodeText(ch[i]).trim()) paras.push(i);
      if (paras.length >= 3) points.push(paras[2] + 1);
      else if (paras.length) points.push(paras[paras.length - 1] + 1);
    }
    if (!points.length) return;

    const picks = pool.slice(0, points.length);
    for (let p = points.length - 1; p >= 0; p--) {
      if (picks[p]) ch.splice(points[p], 0, lesetippNode(picks[p].slug, picks[p].title));
    }
  };
}
