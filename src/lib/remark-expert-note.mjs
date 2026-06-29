// remark plugin: inject a "Dr. Ehrlichmann erklärt" expert box (<aside
// class="expert-qa">) into Ratgeber articles that don't already carry a
// hand-written one. The per-article text lives in src/data/expert-notes.js;
// only slugs present there get a box, so we stay selective (no box on pure
// logistics pages). Content .md files are never touched — re-migrations-safe,
// same approach as remark-lesetipp.
import { expertNotes } from '../data/expert-notes.js';

const AVATAR = '/wp-content/uploads/2021/02/zahnarzt-ehrlichmann-seelscheid.jpg';
const esc = (s) => String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

function selfSlug(file) {
  const p = String((file && (file.path || (file.history && file.history[0]))) || '').replace(/\\/g, '/');
  const m = p.match(/\/content\/ratgeber\/([^/]+)\.md$/);
  return m ? m[1] : '';
}

const hasExpertBox = (ch) =>
  ch.some((n) => n.type === 'html' && /expert-qa/.test(String(n.value || '')));

function boxNode(text) {
  const value =
    '<aside class="expert-qa"><div class="eq-head">' +
    `<img class="eq-avatar" src="${AVATAR}" alt="Dr. Natalia Ehrlichmann" width="56" height="56" loading="lazy" decoding="async">` +
    '<div><div class="eq-name">Dr. Natalia Ehrlichmann</div><div class="eq-role">Expertin für Zahngesundheit</div></div></div>' +
    `<div class="eq-body">${esc(text)}</div></aside>`;
  return { type: 'html', value };
}

export default function remarkExpertNote() {
  return (tree, file) => {
    const slug = selfSlug(file);
    if (!slug) return; // Ratgeber articles only
    const text = expertNotes[slug];
    if (!text) return; // only curated slugs
    const ch = tree.children;
    if (!Array.isArray(ch) || hasExpertBox(ch)) return; // never double up

    const h2 = [];
    for (let i = 0; i < ch.length; i++) if (ch[i].type === 'heading' && ch[i].depth === 2) h2.push(i);

    const node = boxNode(text);
    // Place before the final section (often "Häufige Fragen") on longer articles,
    // otherwise close the article with it.
    if (h2.length >= 2) ch.splice(h2[h2.length - 1], 0, node);
    else ch.push(node);
  };
}
