// remark plugin: normalize migrated internal links that the WordPress export broke.
// Centralizes every routing fix from the pre-launch audit so the content .md files
// stay pristine and re-migration-safe — the same approach as remark-lesetipp /
// remark-consent-embeds (content is never modified; only the mdast is edited).
//
// Fixes applied at build time:
//   1. Ratgeber cross-links missing the /ratgeber/ prefix  (/zahnpflege -> /ratgeber/zahnpflege)
//   2. Wrong / dead slugs remapped to their real route      (/praxis -> /zahnarztpraxis, /datenschutz/ -> /datenschutzerklaerung, ...)
//   3. Two broken <img> paths                               (2016/10 kinderbehandlung -> the real 2019/01 asset)
//   4. Broken image markdown that lost its leading '!'       ([](/x.webp "t") renders as an empty <a>) -> re-materialised as <img>
//
// Works on markdown link/image nodes AND raw-HTML (html) nodes, since the migrated
// content mixes both forms.

// Exact-path remaps. Keys are the offending path WITHOUT a trailing slash.
const REMAP = {
  '/praxis': '/zahnarztpraxis',
  '/datenschutz': '/datenschutzerklaerung',
  '/die-perfekte-zahnpflege': '/ratgeber/zahnpflege',
  '/zahnreinigung': '/leistungen/zahnaesthetik/zahnreinigung',
  '/notdienstsuche': '/ratgeber/notdienst',
  '/thema/ernaehrung-und-zaehne': '/thema/gesunde-zaehne',
  '/zahn-checkliste': '/ratgeber/zahngesundheitstest',
  '/zahn-checkliste/index.html': '/ratgeber/zahngesundheitstest',
};

// Ratgeber article slugs: a bare /<slug> link must become /ratgeber/<slug>.
const RATGEBER_SLUGS = new Set([
  'mundgeruch', 'richtige-zahnpflege-tipps-und-mundhygiene', 'kreidezaehne-erkennen-und-behandeln',
  'freiliegende-zahnhaelse-behandeln', 'zahnarzt-check-vor-der-reise', 'zahngesundheit-in-der-pubertaet',
  'zahnschmerzen-nach-einer-fuellung', 'zahnarztangst-verstehen-und-endlich-besiegen', 'zahnwechsel',
  'die-optimale-prothesenreinigung', 'zahnfleischentzuendung-was-hilft', 'anamnesebogen-unnoetiger-papierkrieg',
  'zahnschmerzen-am-wochenende', 'karies-behandeln', 'muss-ich-zum-zahnarzt', 'parkplatz', 'mit-biss-ins-alter',
  'finanzierung', 'wie-oft-gehen-sie-zum-zahnarzt', 'kinder-und-suessigkeiten', 'zahngesundheitstest', 'zahntipp',
  'lebenslauf-der-zaehne', 'zahnpflege', 'notdienst',
]);

// Broken <img>/image src remaps (audit: two refs to a non-existent 2016/10 path).
const IMG_REMAP = {
  '/wp-content/uploads/2016/10/kinderbehandlung_neunkirchen-seelscheid-2-300x200.jpg':
    '/wp-content/uploads/2019/01/kinderbehandlung_neunkirchen-seelscheid-300x169.jpg',
  '/wp-content/uploads/2016/10/kinderbehandlung_neunkirchen-seelscheid-2.jpg':
    '/wp-content/uploads/2019/01/kinderbehandlung_neunkirchen-seelscheid.jpg',
};

const IMG_EXT = /\.(?:webp|jpe?g|png|gif|svg|avif)$/i;

// Remap a single root-relative path, preserving any #hash / ?query tail.
function fixPath(url) {
  if (typeof url !== 'string' || !url.startsWith('/')) return url;
  const m = url.match(/^([^#?]*)([#?].*)?$/);
  const pathPart = m[1];
  const tail = m[2] || '';
  if (IMG_REMAP[pathPart]) return IMG_REMAP[pathPart] + tail;
  if (REMAP[pathPart]) return REMAP[pathPart] + tail;
  const noSlash = pathPart.length > 1 ? pathPart.replace(/\/$/, '') : pathPart;
  if (REMAP[noSlash]) return REMAP[noSlash] + tail;
  const slug = noSlash.slice(1);
  if (RATGEBER_SLUGS.has(slug)) return '/ratgeber/' + slug + tail;
  // General rule: internal nav links carry no trailing slash (HARD INVARIANT 1).
  if (noSlash !== pathPart) return noSlash + tail;
  return url;
}

// Rewrite href="/…" and src="/…" inside a raw-HTML node value.
function fixHtml(value) {
  return String(value).replace(/\b(href|src)\s*=\s*("|')(\/[^"']*)\2/gi, (full, attr, q, url) => {
    const fixed = fixPath(url);
    return fixed === url ? full : `${attr}=${q}${fixed}${q}`;
  });
}

const humanize = (s) =>
  String(s || '').replace(/\.[a-z0-9]+$/i, '').replace(/-\d+x\d+$/, '').replace(/[-_]+/g, ' ')
    .replace(/\s+/g, ' ').trim().replace(/^\w/, (c) => c.toUpperCase());

const altFromUrl = (url) => humanize(String(url).split(/[#?]/)[0].split('/').pop());

function isEmptyLink(node) {
  if (!node.children || node.children.length === 0) return true;
  return node.children.every((c) => c.type === 'text' && !String(c.value).trim());
}

function walk(node) {
  if (!node || typeof node !== 'object') return;
  if (node.type === 'link') {
    const fixed = fixPath(node.url);
    // [](/x.webp "title") lost its leading '!' in migration -> render as an <img>.
    if (isEmptyLink(node) && IMG_EXT.test(String(fixed).split(/[#?]/)[0])) {
      const alt = humanize(node.title) || altFromUrl(fixed);
      node.type = 'image';
      node.url = fixed;
      node.alt = alt;
      node.title = null;
      delete node.children;
      return;
    }
    if (fixed !== node.url) node.url = fixed;
  } else if (node.type === 'image') {
    const fixed = fixPath(node.url);
    if (fixed !== node.url) node.url = fixed;
  } else if (node.type === 'html') {
    const fixed = fixHtml(node.value);
    if (fixed !== node.value) node.value = fixed;
  }
  (node.children || []).forEach(walk);
}

export default function remarkFixLinks() {
  return (tree) => walk(tree);
}
