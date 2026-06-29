// Semantic WP→Markdown converter for the dentalia/SiteOrigin migration.
// Parses the rendered WordPress HTML, maps the designed "attention blocks"
// (wpremark callouts, accordions, expert-review boxes, aod-cta, checklists,
// tablepress, podcast, "Kurz erklärt" capsule, rpi review widget, carousels,
// video swipebox) to CLEAN semantic HTML that our global.css styles, then runs
// Turndown on the remaining prose. Block HTML is shielded from Turndown via
// placeholder tokens and re-injected afterwards. Dev-only tool — ships nothing.
import { parse } from 'node-html-parser';
import TurndownService from 'turndown';
import { gfm } from 'turndown-plugin-gfm';
import { consentEmbedHTML } from '../../src/lib/consent-embed.mjs';

const MAPS = 'https://www.google.com/maps/place/Zeithstra%C3%9Fe+117,+53819+Neunkirchen-Seelscheid';

export const localize = (html) =>
  (html || '')
    .replaceAll('https://dr-ehrlichmann.de', '')
    .replaceAll('http://dr-ehrlichmann.de', '')
    .replaceAll('//dr-ehrlichmann.de', '');

const ENT = {
  '&amp;': '&', '&lt;': '<', '&gt;': '>', '&quot;': '"', '&#039;': "'", '&#39;': "'",
  '&#8217;': '’', '&#8216;': '‘', '&#8220;': '“', '&#8221;': '”', '&#8211;': '–', '&#8212;': '—',
  '&hellip;': '…', '&nbsp;': ' ', '&auml;': 'ä', '&ouml;': 'ö', '&uuml;': 'ü',
  '&Auml;': 'Ä', '&Ouml;': 'Ö', '&Uuml;': 'Ü', '&szlig;': 'ß',
};
export const decode = (s) =>
  (s || '').replace(/&[a-z]+;|&#0?39;/gi, (m) => ENT[m] ?? m).replace(/&#(\d+);/g, (_, n) => String.fromCharCode(+n));
export const strip = (s) => decode((s || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim());

// strip private-use icon-font glyphs + collapse ws from extracted button/heading text
const cleanText = (s) => decode(s || '').replace(/[-]/g, '').replace(/\s+/g, ' ').trim();
const cleanAttrs = (html) => (html || '').replace(/\s(?:class|style|id|data-[\w-]+|role|aria-[\w-]+|width|height)="[^"]*"/g, '');
const stripStyle = (html) => (html || '').replace(/\sstyle="[^"]*"/g, '').replace(/\s(?:class|id|data-[\w-]+)="[^"]*"/g, '');

// Clean a WP expert-answer's inner HTML into tidy on-brand HTML (keep
// ul/li/b/strong/em/a/br); relativize internal links, mark external ones.
const cleanAnswer = (html) => {
  let h = (html || '').replace(/\\n/g, ' ').replace(/\r?\n/g, ' ').replace(/\s+/g, ' ').trim();
  h = h.replace(/<br\s*\/?>\s*(?=<\/?ul|<li|<\/li>)/gi, '');     // stray <br> around lists
  h = h.replace(/<ul>\s*(?:<br\s*\/?>\s*)+/gi, '<ul>');
  h = h.replace(/(?:<br\s*\/?>\s*)+<\/ul>/gi, '</ul>');
  h = h.replace(/<\/li>\s*(?:<br\s*\/?>\s*)+/gi, '</li>');
  h = localize(h);                                                // internal links -> relative
  h = h.replace(/<a\s+href="(https?:\/\/[^"]+)"([^>]*)>/gi, (m, u, rest) =>
    /target=/.test(rest) ? m : `<a href="${u}" target="_blank" rel="noopener noreferrer">`);
  return h.trim();
};

// Build the on-brand «Fragen an den Experten» block from a node-html-parser
// `.expert-review-qa` element (WP "Expert Review" plugin Q&A). Returns '' if empty.
// Reuses the existing .qa-group / details.qa accordion design.
export const buildExpertQaList = (qaEl) => {
  if (!qaEl) return '';
  const blocks = [];
  for (const c of qaEl.querySelectorAll('.expert-review-qa-container')) {
    const qEl = c.querySelector('.expert-review-qa__question');
    const aEl = c.querySelector('.expert-review-qa__text');
    if (!qEl || !aEl) continue;
    const q = decode((qEl.textContent || '').replace(/\s+/g, ' ').trim());
    const a = cleanAnswer(aEl.innerHTML);
    if (!q || !a) continue;
    blocks.push(`<details class="qa"><summary>${q}</summary><div class="qa-body">${a}</div></details>`);
  }
  if (!blocks.length) return '';
  const icon = '<svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M7.9 20A9 9 0 1 0 4 16.1L3 21z"/><path d="M9.1 9a3 3 0 0 1 5.8 1c0 2-3 3-3 3"/><path d="M12 17h.01"/></svg>';
  return `<aside class="expert-qa-list"><p class="eql-head">${icon} Fragen an den Experten</p><div class="qa-group">${blocks.join('')}</div></aside>`;
};

// ---- inline SVGs (match Icon.astro look: 24x24, stroke=currentColor) ----
const ICON = {
  tip: '<path d="M5 12l4 4 10-10"/>',
  info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8h.01"/>',
  note: '<circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8h.01"/>',
  warning: '<path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h16.9a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z"/><path d="M12 9v4M12 17h.01"/>',
  caution: '<path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h16.9a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z"/><path d="M12 9v4M12 17h.01"/>',
  phone: '<path d="M6 3h3l2 5-2.5 1.5a12 12 0 0 0 6 6L16 13l5 2v3a2 2 0 0 1-2 2A16 16 0 0 1 4 5a2 2 0 0 1 2-2z"/>',
  calendar: '<rect x="3.5" y="5" width="17" height="15" rx="2"/><path d="M3.5 9h17M8 3.5v3M16 3.5v3"/>',
  audio: '<path d="M3 14v-3a9 9 0 0 1 18 0v3"/><rect x="3" y="14" width="4" height="6" rx="1.5"/><rect x="17" y="14" width="4" height="6" rx="1.5"/>',
};
const svg = (name, cls) =>
  `<svg class="${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICON[name] || ''}</svg>`;

function toneFromColor(c) {
  c = (c || '').toLowerCase().trim();
  const map = { '#def9e5': 'tip', '#ffe3db': 'warning', '#e3f1f4': 'info', '#eff4f5': 'note', '#fff4d4': 'caution', '#ffffff': 'note' };
  if (map[c]) return map[c];
  const m = c.match(/#([0-9a-f]{6})/);
  if (m) {
    const r = parseInt(m[1].slice(0, 2), 16), g = parseInt(m[1].slice(2, 4), 16), b = parseInt(m[1].slice(4, 6), 16);
    if (r > 230 && g > 230 && b < 225) return 'caution';
    if (g >= r && g >= b && g - b > 8) return 'tip';
    if (r > g && r - b > 16) return 'warning';
    if (b >= r && b >= g) return 'info';
  }
  return 'note';
}

function parseVideo(url) {
  const u = (url || '').trim();
  let m;
  if ((m = u.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([\w-]{6,})/))) return { provider: 'youtube', id: m[1] };
  if ((m = u.match(/(?:player\.)?vimeo\.com\/(?:video\/)?(\d+)/))) return { provider: 'vimeo', id: m[1] };
  return null;
}

// nearest preceding heading text, for a video/embed title (DOM-API-safe)
function headingBefore(el) {
  try {
    let cur = el;
    for (let hop = 0; hop < 6 && cur; hop++) {
      const parent = cur.parentNode;
      if (!parent || !parent.childNodes) break;
      const kids = parent.childNodes;
      const idx = kids.indexOf(cur);
      for (let j = idx - 1; j >= 0; j--) {
        const k = kids[j];
        if (k && /^h[1-4]$/i.test(k.tagName || '')) return cleanText(k.text);
      }
      cur = parent;
    }
  } catch { /* best-effort */ }
  return '';
}

export function htmlToMarkdown(rawHtml, { keepFigure = true } = {}) {
  const root = parse(localize(rawHtml || ''));

  // 1) wpremark color map from <style> (hash -> background-color)
  const colorByHash = {};
  root.querySelectorAll('style').forEach((s) => {
    for (const m of (s.text || '').matchAll(/\.wpremark--(\w+)\s*\{([^}]*)\}/g)) {
      const bg = (m[2].match(/background-color:\s*([^;]+)/) || [])[1];
      if (bg) colorByHash[m[1]] = bg.trim();
    }
  });

  // strip leaked CSS/JS, dead Tailwind, external + gif imgs FIRST, so captured
  // innerHTML (accordion answers etc.) never carries these artifacts.
  root.querySelectorAll('style,script,noscript').forEach((n) => n.remove());
  root.querySelectorAll('img').forEach((img) => {
    const src = img.getAttribute('src') || '';
    if (/googleusercontent|graph\.facebook|fbsbx|lookaside/.test(src)) { const a = img.closest('a'); (a || img).remove(); return; }
    if (/\.gif(\?|$)/i.test(src)) { img.remove(); } // dated decorative GIF icons
  });

  const blocks = [];
  const tok = (html) => `\n\nCEBLK${blocks.push(html) - 1}ENDBLK\n\n`;
  const replace = (el, html) => { try { el.replaceWith(tok(html)); } catch { /* detached */ } };

  // 2) video swipebox links -> consent embed (before image handling)
  root.querySelectorAll('a').forEach((a) => {
    const href = a.getAttribute('href') || '';
    const vid = parseVideo(href);
    const img = a.querySelector('img');
    const cls = a.getAttribute('class') || '';
    if (vid && (img || /swipebox|fancybox|video/i.test(cls))) {
      const title = (img && cleanText(img.getAttribute('alt')) && !/^play/i.test(img.getAttribute('alt'))) ? cleanText(img.getAttribute('alt')) : (headingBefore(a) || 'Video');
      const thumb = img ? (img.getAttribute('src') || '') : '';
      replace(a, consentEmbedHTML({ provider: vid.provider, id: vid.id, title, thumb }));
    }
  });

  // 3) wpremark callouts
  root.querySelectorAll('.wpremark').forEach((el) => {
    const hash = (el.getAttribute('class') || '').match(/wpremark--(\w+)/);
    const tone = toneFromColor(hash ? colorByHash[hash[1]] : '');
    const body = el.querySelector('.wpremark-content') || el.querySelector('.wpremark-body') || el;
    const icon = tone === 'tip' ? 'tip' : tone === 'warning' || tone === 'caution' ? 'warning' : 'info';
    replace(el, `<aside class="callout callout--${tone}">${svg(icon, 'callout-icon')}<div class="callout-body">${stripStyle(body.innerHTML.trim())}</div></aside>`);
  });

  // 4) "Kurz erklärt" answer capsule (custom #00AEC7 border box)
  root.querySelectorAll('div').forEach((el) => {
    const st = el.getAttribute('style') || '';
    if (/border\s*:\s*2px\s+solid\s*#00aec7/i.test(st)) {
      const h = el.querySelector('h1,h2,h3');
      const label = h ? cleanText(h.text) : 'Kurz erklärt';
      if (h) h.remove();
      replace(el, `<aside class="answer-capsule"><p class="lbl">${label}</p>${stripStyle(el.innerHTML.trim())}</aside>`);
    }
  });

  // 5) accordions (.panel-group) -> native <details>
  root.querySelectorAll('.panel-group').forEach((grp) => {
    const items = grp.querySelectorAll('.panel');
    const parts = items.map((p, i) => {
      const a = p.querySelector('.panel-title a, .panel-title');
      const q = a ? cleanText(a.text) : '';
      const bodyEl = p.querySelector('.panel-body');
      const ans = bodyEl ? stripStyle(bodyEl.innerHTML.trim()) : '';
      if (!q) return '';
      return `<details class="qa"${i === 0 ? ' open' : ''}><summary>${q}</summary><div class="qa-body">${ans}</div></details>`;
    }).filter(Boolean);
    replace(grp, `<div class="qa-group">${parts.join('')}</div>`);
  });

  // 6) expert-review -> expert-qa (bio) OR takeaways (pluses/minuses)
  root.querySelectorAll('.expert-review').forEach((el) => {
    const pm = el.querySelector('.expert-review-pluses-minuses');
    if (pm) {
      const pluses = pm.querySelectorAll('.expert-review-plus').map((x) => `<li>${stripStyle(x.innerHTML.trim())}</li>`).join('');
      const minuses = pm.querySelectorAll('.expert-review-minus').map((x) => `<li>${stripStyle(x.innerHTML.trim())}</li>`).join('');
      let html = '<aside class="expert-qa expert-qa--takeaways"><div class="eq-name">Das Wichtigste in Kürze</div>';
      if (pluses) html += `<ul class="icon-list icon-list--check">${pluses}</ul>`;
      if (minuses) html += `<ul class="icon-list icon-list--minus">${minuses}</ul>`;
      html += '</aside>';
      replace(el, html);
      return;
    }
    const avatar = el.querySelector('.expert-review-expert-bio__avatar img');
    const name = cleanText((el.querySelector('.expert-review-expert-bio-name') || {}).text);
    const role = cleanText((el.querySelector('.expert-review-expert-bio-description') || {}).text);
    const textEl = el.querySelector('.expert-review-expert-text');
    const answer = textEl ? stripStyle(textEl.innerHTML.trim()) : '';
    const src = avatar ? (avatar.getAttribute('src') || '') : '';
    if (!answer && !name) { el.remove(); return; }
    const head = `<div class="eq-head">${src ? `<img class="eq-avatar" src="${src}" alt="${name || 'Dr. Natalia Ehrlichmann'}" width="56" height="56" loading="lazy">` : ''}<div><div class="eq-name">${name || 'Dr. Natalia Ehrlichmann'}</div>${role ? `<div class="eq-role">${role}</div>` : ''}</div></div>`;
    // also restore the «Fragen an den Experten» Q&A list (nested in .expert-review)
    const qaList = buildExpertQaList(el.querySelector('.expert-review-qa'));
    replace(el, `<aside class="expert-qa">${head}<div class="eq-body">${answer}</div></aside>${qaList}`);
  });

  // 7) aod-cta -> .cta-pair with our icons
  root.querySelectorAll('.aod-cta-block').forEach((el) => {
    const ph = el.querySelector('.aod-cta-phone');
    const tm = el.querySelector('.aod-cta-terminanfrage');
    const phHref = ph ? (ph.getAttribute('href') || 'tel:+4922477171') : 'tel:+4922477171';
    const phLbl = ph ? cleanText((ph.querySelector('.aod-btn-label') || ph).text) : '02247 7171 – Jetzt anrufen';
    const tmHref = tm ? (tm.getAttribute('href') || '/terminanfrage') : '/terminanfrage';
    const tmLbl = tm ? cleanText((tm.querySelector('.aod-btn-label') || tm).text) : 'Termin online anfragen';
    replace(el, `<div class="cta-pair"><a class="btn btn-cyan" href="${phHref}">${svg('phone', 'ic')} ${phLbl}</a><a class="btn btn-ghost" href="${tmHref}">${svg('calendar', 'ic')} ${tmLbl}</a></div>`);
  });

  // 8) checklists -> .icon-list
  root.querySelectorAll('ul.list-checklist, ul.list-star, ul.list-arrow, ul.no-liststyle').forEach((el) => {
    const cls = el.getAttribute('class') || '';
    const mod = /list-star/.test(cls) ? 'star' : /list-arrow/.test(cls) ? 'arrow' : 'check';
    const items = el.querySelectorAll('li').map((li) => {
      const wrap = li.querySelector('.wrapper');
      const inner = stripStyle((wrap ? wrap.innerHTML : li.innerHTML).trim());
      return inner ? `<li>${inner}</li>` : '';
    }).filter(Boolean).join('');
    if (items) replace(el, `<ul class="icon-list icon-list--${mod}">${items}</ul>`);
  });

  // 9) tablepress -> clean .data-table
  root.querySelectorAll('table').forEach((el) => {
    const inner = cleanAttrs(el.innerHTML).trim();
    replace(el, `<div class="table-wrap"><table class="data-table">${inner}</table></div>`);
  });

  // 10) podcast (audio7) -> native <audio>
  root.querySelectorAll('.audio7_html5').forEach((el) => {
    const get = (c) => { const n = el.querySelector(c); return n ? cleanText(n.text) : ''; };
    const title = get('.xtitle') || 'Podcast';
    const img = get('.ximage');
    const mp3 = get('.xsources_mp3');
    if (!mp3) { el.remove(); return; }
    replace(el, `<div class="podcast">${img ? `<img class="podcast-cover" src="${img}" alt="Podcast-Cover: ${(title || '').replace(/"/g, '&quot;')}" width="72" height="72" loading="lazy">` : ''}<div class="podcast-body"><span class="podcast-kicker">${svg('audio', 'ic')} Podcast</span><strong class="podcast-title">${title}</strong><audio class="podcast-audio" controls preload="none" src="${mp3}"></audio></div></div>`);
  });

  // 11) rpi review widget (Google/FB, external avatars) -> static rating badge
  root.querySelectorAll('.rpi').forEach((el) => {
    replace(el, `<aside class="rating-badge"><span class="rb-stars" aria-hidden="true">★★★★★</span> <strong>4,8</strong> <span class="rb-text">· <a href="${MAPS}" target="_blank" rel="noopener noreferrer">27&nbsp;Google-Bewertungen</a></span></aside>`);
  });

  // 11b) fbd forum-list (most-discussed comments widget) -> .discuss
  root.querySelectorAll('.fbd-forum-list').forEach((el) => {
    const stats = cleanText((el.querySelector('.fbd-stats-text') || {}).text);
    const items = el.querySelectorAll('.fbd-forum-item').map((a) => {
      const href = a.getAttribute('href') || '#';
      const thumbEl = a.querySelector('.fbd-thumb');
      const tm = (thumbEl && (thumbEl.getAttribute('style') || '')).match ? (thumbEl.getAttribute('style') || '').match(/url\(([^)]+)\)/) : null;
      const thumbUrl = tm ? tm[1].replace(/['"]/g, '') : '';
      const title = cleanText((a.querySelector('.fbd-title') || {}).text);
      const last = cleanText((a.querySelector('.fbd-last-activity') || {}).text);
      const count = cleanText((a.querySelector('.fbd-count') || {}).text);
      return `<a class="discuss-item" href="${href}"><span class="discuss-thumb"${thumbUrl ? ` style="background-image:url('${thumbUrl}')"` : ''} aria-hidden="true"></span><span class="discuss-text"><span class="discuss-title">${title}</span><span class="discuss-last">${last}</span></span><span class="discuss-count"><b>${count}</b><small>Kommentare</small></span></a>`;
    }).join('');
    replace(el, `<aside class="discuss">${stats ? `<p class="discuss-stats">${stats}</p>` : ''}${items}</aside>`);
  });

  // 11c) Quizle quizzes -> mount (rendered client-side by src/scripts/quiz.js from src/data/quizzes.js)
  root.querySelectorAll('.quizle').forEach((q) => {
    const id = q.getAttribute('data-identity') || '';
    const cont = q.closest('.quizle-container') || q;
    replace(cont, `<div class="quiz-mount" data-quiz="${id}"></div>`);
  });

  // 12) carousels / gallery images -> centered figure
  root.querySelectorAll('.orion_carousel').forEach((el) => {
    const img = el.querySelector('img');
    if (!img) { el.remove(); return; }
    replace(el, figureFor(img));
  });

  // 13) remaining standalone images -> figure with alignment + dimensions
  root.querySelectorAll('img').forEach((img) => {
    const fig = figureFor(img);
    const link = img.closest('a');
    replace(link && link.querySelectorAll('img').length === 1 ? link : img, fig);
  });

  // Review-attribution headings ("– Christine S." linking to jameda/Google/etc.)
  // are not section headings — demote to a citation so they leave the outline.
  root.querySelectorAll('h3,h4,h5,h6').forEach((h) => {
    const a = h.querySelector('a');
    const href = a ? (a.getAttribute('href') || '') : '';
    const txt = cleanText(h.text);
    if (a && /jameda|stadtbranchenbuch|share\.google|google\.[a-z.]+\/maps|provenexpert|sanego/i.test(href) && /^[\\\-–—\s]/.test(txt)) {
      h.replaceWith(`<p class="quote-cite">${h.innerHTML}</p>`);
    }
  });

  // Normalize remaining (top-level) content heading levels so they never skip
  // (a11y: heading-order). Runs AFTER block transforms so headings that lived
  // inside extracted blocks don't pollute the sequence. Article <h1> = page
  // title (template), so content starts at h2; each heading ≤ prev+1.
  {
    let prev = 1;
    for (const h of root.querySelectorAll('h1,h2,h3,h4,h5,h6')) {
      let lvl = +(h.tagName || 'H2')[1] || 2;
      if (lvl < 2) lvl = 2;
      lvl = Math.min(lvl, prev + 1);
      prev = lvl;
      if (`H${lvl}` !== (h.tagName || '').toUpperCase()) {
        h.replaceWith(`<h${lvl}>${h.innerHTML}</h${lvl}>`);
      }
    }
  }

  // ---- Turndown the remainder ----
  const td = new TurndownService({ headingStyle: 'atx', codeBlockStyle: 'fenced', bulletListMarker: '-', emDelimiter: '*' });
  td.use(gfm);
  let md = td.turndown(root.toString());

  // re-inject shielded blocks (loop: a block's HTML may itself carry a nested
  // token, e.g. a callout that lived inside an accordion answer).
  for (let pass = 0; pass < 6 && /CEBLK\d+ENDBLK/.test(md); pass++) {
    md = md.replace(/CEBLK(\d+)ENDBLK/g, (_, i) => `\n\n${blocks[+i]}\n\n`);
  }
  // final safety scrub: any stray leaked CSS/JS that slipped through
  md = md
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/^\s*\.[\w-]+(?:--\w+)?\s*\{[^}]*\}\s*$/gm, '')
    .replace(/^\s*jQuery\([\s\S]*?\}\);?\s*$/gm, '');
  // tidy
  md = md.replace(/\n{3,}/g, '\n\n').replace(/[ \t]+\n/g, '\n').trim();
  return md;

  function figureFor(img) {
    const src = img.getAttribute('src') || '';
    let altRaw = (img.getAttribute('alt') || '').trim();
    if (!altRaw) {
      // fallback: humanize the filename so no content image ships empty alt
      const fn = (src.split('/').pop() || '').replace(/\.[a-z0-9]+$/i, '').replace(/-\d+x\d+$/i, '').replace(/[-_]+/g, ' ').trim();
      altRaw = fn ? fn.charAt(0).toUpperCase() + fn.slice(1) : 'Zahnarztpraxis Dr. Ehrlichmann';
    }
    const alt = altRaw.replace(/"/g, '&quot;');
    const w = img.getAttribute('width');
    const h = img.getAttribute('height');
    const cls = img.getAttribute('class') || '';
    const align = /alignleft/.test(cls) ? 'left' : /alignright/.test(cls) ? 'right' : 'center';
    const a = img.closest('a');
    const href = a && (a.getAttribute('href') || '');
    const imgTag = `<img src="${src}" alt="${alt}"${w ? ` width="${w}"` : ''}${h ? ` height="${h}"` : ''} loading="lazy" decoding="async">`;
    const inner = href ? `<a href="${href}">${imgTag}</a>` : imgTag;
    return `<figure class="align-${align}">${inner}</figure>`;
  }
}
