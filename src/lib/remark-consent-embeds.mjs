// remark plugin: turn YouTube/Vimeo references in Markdown into consent-gated
// embeds (self-hosted "2-Klick-Lösung") — nothing loads from a third party
// until the visitor clicks. Keeps the DSGVO invariant: 0 live external calls
// in the built HTML; the iframe is created client-side only after consent.
//
// Handles two shapes found in the migrated WordPress content + future edits:
//   1) Broken thumbnail-link (how the WP export landed): a paragraph ending in
//      an image, followed by a paragraph that is just `](VIDEO_URL)`.
//   2) Clean link alone in a paragraph: [text](VIDEO_URL) or [![alt](thumb)](VIDEO_URL).
import { consentEmbedHTML } from './consent-embed.mjs';

function parseVideo(url) {
  const u = (url || '').trim();
  let m;
  if ((m = u.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([\w-]{6,})/)))
    return { provider: 'youtube', id: m[1] };
  if ((m = u.match(/(?:player\.)?vimeo\.com\/(?:video\/)?(\d+)/))) return { provider: 'vimeo', id: m[1] };
  return null;
}

function nodeText(node) {
  if (!node) return '';
  if (node.type === 'text' || node.type === 'inlineCode') return node.value || '';
  if (node.type === 'image') return node.alt || '';
  return (node.children || []).map(nodeText).join('');
}

// "Zahnarztangst überwinden: Video (7 Min.)" -> "Zahnarztangst überwinden"
function cleanHeading(t) {
  const out = (t || '')
    .replace(/\s*[:(–-]?\s*Video\b.*$/i, '')
    .replace(/[\s():–-]+$/, '')
    .trim();
  return out;
}

function titleFromHeadingBefore(children, i) {
  for (let j = i - 1; j >= 0; j--) {
    const n = children[j];
    if (n.type === 'heading') {
      const t = cleanHeading(nodeText(n));
      if (t) return t;
      break;
    }
    if (n.type === 'paragraph' && nodeText(n).trim() !== '') break; // don't reach across real content
  }
  return 'Video';
}

function pickTitle(altOrText, children, i) {
  const t = (altOrText || '').trim();
  if (t && t.toLowerCase() !== 'play video' && !/^https?:/i.test(t)) return t;
  return titleFromHeadingBefore(children, i);
}

export default function remarkConsentEmbeds() {
  return (tree) => {
    const ch = tree.children;
    if (!Array.isArray(ch)) return;

    for (let i = 0; i < ch.length; i++) {
      const node = ch[i];
      if (node.type !== 'paragraph') continue;

      // --- Pattern 1: paragraph ending in <image>, next paragraph is `](URL)` ---
      const img = [...(node.children || [])].reverse().find((c) => c.type === 'image');
      const next = ch[i + 1];
      if (img && next && next.type === 'paragraph') {
        // nodeText() so a GFM-autolinked URL (a <link> child, no .value) is included
        const txt = nodeText(next).trim();
        const mm = txt.match(/^\]\(\s*(\S+?)\s*\)$/);
        const vid = mm && parseVideo(mm[1]);
        const lead = (node.children || [])
          .filter((c) => c.type === 'text')
          .map((c) => c.value)
          .join('')
          .replace(/\[/g, '')
          .trim();
        if (vid && lead === '') {
          const title = pickTitle(img.alt, ch, i);
          const html = consentEmbedHTML({ provider: vid.provider, id: vid.id, title, thumb: img.url });
          ch.splice(i, 2, { type: 'html', value: html });
          continue;
        }
      }

      // --- Pattern 2: a single video link alone in a paragraph ---
      const kids = (node.children || []).filter((c) => !(c.type === 'text' && (c.value || '').trim() === ''));
      if (kids.length === 1 && kids[0].type === 'link') {
        const vid = parseVideo(kids[0].url);
        if (vid) {
          const innerImg = (kids[0].children || []).find((c) => c.type === 'image');
          const label = innerImg ? innerImg.alt : nodeText(kids[0]);
          const title = pickTitle(label, ch, i);
          const html = consentEmbedHTML({ provider: vid.provider, id: vid.id, title, thumb: innerImg && innerImg.url });
          ch.splice(i, 1, { type: 'html', value: html });
          continue;
        }
      }
    }
  };
}
