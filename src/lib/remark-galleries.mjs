// remark plugin: group a run of consecutive standalone images (the flattened
// WordPress galleries) into a "1 lead tile + small tiles" mosaic, and pull the
// short paragraph that follows into a <figcaption> — mirroring the original
// Dentalia gallery (one big image + three small), restyled in our MedSpace look.
//
// The WP export dropped the leading '!' on gallery images, leaving runs of
// `[](/img.webp "title")` empty-links; remark-fix-links re-materialises each as
// an image node. This plugin MUST run AFTER remark-fix-links so it sees images.
// Content .md stays pristine (re-migration-safe), same approach as the other
// build-time remark plugins.

const esc = (s) =>
  String(s == null ? '' : s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

function textOf(n) {
  if (!n) return '';
  if (n.type === 'text' || n.type === 'inlineCode') return n.value || '';
  return (n.children || []).map(textOf).join('');
}

// A paragraph whose only meaningful content is image node(s). Returns the images.
function imagesOfParagraph(node) {
  if (!node || node.type !== 'paragraph') return null;
  const imgs = [];
  for (const c of node.children || []) {
    if (c.type === 'image') imgs.push(c);
    else if (c.type === 'text' && !String(c.value).trim()) continue;
    else return null; // real, non-image content -> not a gallery row
  }
  return imgs.length ? imgs : null;
}

// The short plain-text paragraph that follows a gallery = its caption.
function captionOf(node) {
  if (!node || node.type !== 'paragraph') return null;
  for (const c of node.children || []) {
    if (!['text', 'emphasis', 'strong', 'inlineCode'].includes(c.type)) return null;
  }
  const txt = textOf(node).trim();
  if (!txt || txt.length > 140) return null;
  return txt;
}

function galleryHTML(imgs, caption) {
  const n = imgs.length;
  const tiles = imgs
    .map((im, i) => {
      const url = esc(im.url);
      const alt = esc(im.alt || '');
      const lead = i === 0;
      const cls = lead ? 'g-tile g-tile--lead' : 'g-tile';
      const style = lead ? ` style="grid-row:span ${Math.max(1, n - 1)}"` : '';
      return `<a class="${cls}"${style} href="${url}"><img src="${url}" alt="${alt}" loading="lazy" decoding="async"></a>`;
    })
    .join('');
  const cap = caption ? `<figcaption>${esc(caption)}</figcaption>` : '';
  return `<figure class="gallery gallery--${n}">${tiles}${cap}</figure>`;
}

export default function remarkGalleries() {
  return (tree) => {
    const ch = tree.children;
    if (!Array.isArray(ch)) return;
    for (let i = 0; i < ch.length; i++) {
      const first = imagesOfParagraph(ch[i]);
      if (!first) continue;
      const imgs = [...first];
      let j = i + 1;
      while (j < ch.length) {
        const more = imagesOfParagraph(ch[j]);
        if (!more) break;
        imgs.push(...more);
        j++;
      }
      if (imgs.length < 3) continue; // a single/double image is not a gallery
      let consume = j - i;
      const caption = captionOf(ch[j]);
      if (caption) consume += 1;
      ch.splice(i, consume, { type: 'html', value: galleryHTML(imgs, caption) });
      // i now points at the inserted html node; the loop's i++ moves past it.
    }
  };
}
