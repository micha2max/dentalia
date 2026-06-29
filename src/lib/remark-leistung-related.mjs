// remark plugin: clean up migrated WordPress "card dump" blocks on content
// pages (Leistungen leaf pages + Praxisphilosophie) so they don't look like a
// raw export. Works on the mdast only — .md files are never touched
// (re-migrations-safe, same approach as remark-lesetipp / remark-fix-links).
//
// Transforms (in order):
//  1) Leading ALL-CAPS heading that only acts as a kicker (directly followed by
//     the real heading) -> styled eyebrow.
//  2) Stray ALL-CAPS standalone paragraph -> eyebrow (short) or pullquote
//     (a full uppercase sentence, e.g. the "JEDER MENSCH IST EINMALIG…" tagline).
//  3) Every run (>=2) of "card units" -> a clean card grid (reuses
//     .related / .related-card). A card unit is an optional *linked* figure +
//     a heading whose text is a link (or that is followed by a "Mehr Info"
//     link) + an optional description. Titles, labels and images are normalised
//     via a frontmatter index (pages + ratgeber) so even image-less or ALL-CAPS
//     units render consistently.
//  4) Leftover lone "Mehr Info" link -> labelled "Mehr erfahren: <Titel>".
//  5) A trailing bare internal link (e.g. "[Praxisteam]") -> styled link.
import fs from 'node:fs';
import path from 'node:path';

const PAGES_DIR = path.join('src', 'content', 'pages');
const RATGEBER_DIR = path.join('src', 'content', 'ratgeber');
const FALLBACK_IMG = '/wp-content/uploads/2019/02/behandlungsraum_blau.jpg';
let INDEX = null;

function fmField(fm, k) {
  return (fm.match(new RegExp('^' + k + ':\\s*"?(.*?)"?\\s*$', 'm')) || [])[1] || '';
}

// path -> { title, hero, label } from pages + ratgeber frontmatter, cached.
function buildIndex() {
  if (INDEX) return INDEX;
  INDEX = {};
  const take = (dir, keyFor, labelKey) => {
    let files = [];
    try { files = fs.readdirSync(dir); } catch { files = []; }
    for (const f of files) {
      if (!f.endsWith('.md')) continue;
      let src = '';
      try { src = fs.readFileSync(path.join(dir, f), 'utf8'); } catch { continue; }
      const end = src.indexOf('\n---', 3);
      const fm = end > 0 ? src.slice(0, end) : src.slice(0, 1200);
      const key = keyFor(f, fm);
      if (!key) continue;
      INDEX[key] = {
        title: fmField(fm, 'title').replace(/\\"/g, '"'),
        hero: fmField(fm, 'hero'),
        label: fmField(fm, labelKey),
      };
    }
  };
  take(PAGES_DIR, (f, fm) => fmField(fm, 'path'), 'parentTitle');
  take(RATGEBER_DIR, (f) => `/ratgeber/${f.slice(0, -3)}`, 'category');
  return INDEX;
}

const esc = (s) => String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

function nodeText(node) {
  if (!node) return '';
  if (node.value != null && (node.type === 'text' || node.type === 'inlineCode')) return node.value;
  if (node.type === 'html') return String(node.value || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');
  return (node.children || []).map(nodeText).join('');
}
function firstLink(node) {
  if (!node) return null;
  if (node.type === 'link') return node;
  for (const c of node.children || []) { const r = firstLink(c); if (r) return r; }
  return null;
}
function mehrInfoHref(node) {
  if (!node || node.type !== 'paragraph') return null;
  const l = firstLink(node);
  if (!l) return null;
  return /^mehr\s*(info|erfahren)/i.test(nodeText(l).trim()) ? String(l.url || '') : null;
}
const isFigure = (n) => n && n.type === 'html' && /<figure[\s>]/i.test(String(n.value || ''));
const figImg = (n) => (String(n.value || '').match(/<img[^>]*\ssrc="([^"]+)"/i) || [])[1] || '';
const figHref = (n) => (String(n.value || '').match(/<a[^>]*\shref="([^"]+)"/i) || [])[1] || '';

const ALLCAPS = (s) => {
  const t = String(s || '').trim();
  return t.length >= 5 && t.length <= 90 && /[A-ZÄÖÜ]/.test(t) && !/[a-zäöüß]/.test(t) &&
    /^[A-ZÄÖÜ0-9 ,.\-?!&():/„""]+$/.test(t);
};
const kickerNode = (t) => ({ type: 'html', value: `<p class="leistung-kicker">${esc(t.trim())}</p>` });
const pullquoteNode = (t) => ({ type: 'html', value: `<p class="pullquote">${esc(t.trim())}</p>` });

function isTargetPage(file) {
  const p = String((file && (file.path || (file.history && file.history[0]))) || '').replace(/\\/g, '/');
  return /\/content\/pages\/(leistungen[^/]*|praxisphilosophie)\.md$/.test(p);
}
function isLeistungPath(file) {
  const p = String((file && (file.path || (file.history && file.history[0]))) || '').replace(/\\/g, '/');
  return /\/content\/pages\/leistungen/.test(p);
}

// Detect "card units" across the whole child list.
function findUnits(ch) {
  const units = [];
  for (let i = 0; i < ch.length; i++) {
    const h = ch[i];
    if (!h || h.type !== 'heading' || h.depth < 3 || h.depth > 4) continue;
    const hl = firstLink(h);
    let k = i + 1, descNode = null;
    if (ch[k] && ch[k].type === 'paragraph' && !mehrInfoHref(ch[k]) && nodeText(ch[k]).trim()) { descNode = ch[k]; k++; }
    const mehr = mehrInfoHref(ch[k]);
    if (!hl && !mehr) continue;          // needs a link signal to be a "card"
    if (!descNode && !mehr) continue;    // a bare linked heading alone is not a card dump
    let start = i, figNode = null;
    if (i - 1 >= 0 && isFigure(ch[i - 1]) && figHref(ch[i - 1])) { figNode = ch[i - 1]; start = i - 1; }
    const end = mehr ? k : (descNode ? i + 1 : i);
    const href = (hl && hl.url) || mehr || (figNode && figHref(figNode)) || '';
    units.push({ start, end, headNode: h, descNode, figNode, href });
  }
  return units;
}

export default function remarkLeistungRelated() {
  return (tree, file) => {
    if (!isTargetPage(file)) return;
    const ch = tree.children;
    if (!Array.isArray(ch) || !ch.length) return;
    const index = buildIndex();
    const isLeistung = isLeistungPath(file);

    // 1) an ALL-CAPS heading immediately followed by another heading is a
    //    decorative kicker/eyebrow (it has no body of its own, e.g. a leading
    //    "WAS SIND…" or a mid-page "FÜR PERFEKTE ZÄHNE" subtitle) -> styled eyebrow.
    for (let i = 0; i < ch.length - 1; i++) {
      if (ch[i] && ch[i].type === 'heading' && ch[i + 1] && ch[i + 1].type === 'heading' && ALLCAPS(nodeText(ch[i]))) {
        ch[i] = kickerNode(nodeText(ch[i]));
      }
    }

    // 2) stray ALL-CAPS standalone paragraphs -> eyebrow / pullquote
    for (let i = 0; i < ch.length; i++) {
      const n = ch[i];
      if (n.type === 'paragraph' && !firstLink(n) && ALLCAPS(nodeText(n))) {
        const t = nodeText(n).trim();
        ch[i] = (t.length > 28 && /[.!?]/.test(t)) ? pullquoteNode(t) : kickerNode(t);
      }
    }

    // 3) every run (>=2) of card units -> a card grid (process last->first)
    const units = findUnits(ch);
    const chains = [];
    if (units.length) {
      let cur = [units[0]];
      for (let k = 1; k < units.length; k++) {
        if (units[k].start === cur[cur.length - 1].end + 1) cur.push(units[k]);
        else { chains.push(cur); cur = [units[k]]; }
      }
      chains.push(cur);
    }
    for (const chain of chains.filter((c) => c.length >= 2).reverse()) {
      let blockStart = chain[0].start;
      const blockEnd = chain[chain.length - 1].end;
      let heading = isLeistung ? 'Weitere Leistungen' : '';
      const prev = ch[blockStart - 1];
      if (prev && prev.type === 'heading' && /leistung|weitere|unsere|passend|behandlung|womit/i.test(nodeText(prev))) {
        heading = nodeText(prev).trim();
        blockStart -= 1;
      }
      const cards = chain.map((u) => {
        const meta = index[u.href] || {};
        const htext = nodeText(u.headNode).trim();
        // keep the author's heading label when it's clean; fall back to the
        // indexed page title only for mis-migrated ALL-CAPS (or empty) headings.
        const title = (htext && !ALLCAPS(htext)) ? htext : (meta.title || htext);
        const desc = u.descNode ? nodeText(u.descNode).trim() : '';
        const img = (u.figNode && figImg(u.figNode)) || meta.hero || FALLBACK_IMG;
        const label = meta.label || (isLeistung ? 'Leistung' : '');
        return `<a class="related-card" href="${esc(u.href)}">` +
          `<div class="rm"><img src="${esc(img)}" alt="${esc(title)}" loading="lazy" decoding="async"></div>` +
          `<div class="rb">${label ? `<small>${esc(label)}</small>` : ''}<h3>${esc(title)}</h3>` +
          (desc ? `<p class="rdesc">${esc(desc)}</p>` : '') +
          `<span class="rmore">Mehr erfahren →</span></div></a>`;
      }).join('');
      const grid = {
        type: 'html',
        value: `<section class="related leistung-rel">${heading ? `<h2>${esc(heading)}</h2>` : ''}<div class="related-grid">${cards}</div></section>`,
      };
      ch.splice(blockStart, blockEnd - blockStart + 1, grid);
    }

    // 4) leftover lone "Mehr Info" link -> labelled link
    for (let i = 0; i < ch.length; i++) {
      const href = mehrInfoHref(ch[i]);
      if (!href) continue;
      const title = (index[href] || {}).title || 'Mehr erfahren';
      ch[i] = { type: 'html', value: `<p class="leistung-more"><a href="${esc(href)}">Mehr erfahren: ${esc(title)} <span aria-hidden="true">→</span></a></p>` };
    }

    // 5) a trailing bare internal link (e.g. "[Praxisteam]") -> styled link
    const last = ch[ch.length - 1];
    if (last && last.type === 'paragraph') {
      const l = firstLink(last);
      if (l && /^\//.test(String(l.url || '')) && nodeText(last).trim() === nodeText(l).trim()) {
        ch[ch.length - 1] = {
          type: 'html',
          value: `<p class="leistung-more"><a href="${esc(l.url)}">${esc(nodeText(l).trim())} <span aria-hidden="true">→</span></a></p>`,
        };
      }
    }
  };
}
