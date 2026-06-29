// Single source of truth for the consent-gated embed markup.
// Used by BOTH the <ConsentEmbed> Astro component (set:html) and the
// remark-consent-embeds plugin, so component- and Markdown-generated embeds
// are byte-identical and share the global CSS (.consent-embed/.ce-*) and the
// global controller in BaseLayout. No client code here — HTML strings only.

const META = {
  youtube: { label: 'YouTube', host: 'Google Ireland Ltd.', privacy: 'https://policies.google.com/privacy' },
  vimeo: { label: 'Vimeo', host: 'Vimeo Inc.', privacy: 'https://vimeo.com/privacy' },
  maps: { label: 'Google Maps', host: 'Google Ireland Ltd.', privacy: 'https://policies.google.com/privacy' },
};

const esc = (s = '') =>
  String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

export function consentEmbedSrc({ provider, id = '', src = '' }) {
  if (src) return src;
  if (provider === 'youtube') return `https://www.youtube-nocookie.com/embed/${id}?rel=0`;
  if (provider === 'vimeo') return `https://player.vimeo.com/video/${id}?dnt=1`;
  return '';
}

export function consentEmbedHTML({ provider = 'youtube', id = '', src = '', title = '', thumb = '', ratio = '' }) {
  const m = META[provider] || META.youtube;
  const embedSrc = consentEmbedSrc({ provider, id, src });
  const poster = thumb || (provider === 'youtube' && id ? `/wp-content/uploads/_video-poster/${id}.jpg` : '');
  const aspect = ratio || (provider === 'maps' ? '4 / 3' : '16 / 9');

  return (
    `<figure class="consent-embed" data-provider="${provider}" data-src="${esc(embedSrc)}" data-title="${esc(title)}" style="--ce-ratio:${aspect}">` +
    `<div class="ce-placeholder" role="group" aria-label="Externer Inhalt: ${esc(m.label)}">` +
    (poster ? `<span class="ce-poster" style="background-image:url('${esc(poster)}')" aria-hidden="true"></span>` : '') +
    `<div class="ce-box">` +
    `<p class="ce-title">${esc(title)}</p>` +
    `<p class="ce-note">Zum Anzeigen wird Inhalt von <strong>${esc(m.label)}</strong> (${esc(m.host)}) geladen. ` +
    `Dabei werden Daten (u.&nbsp;a. Ihre IP-Adresse) an den Anbieter übertragen. Mehr in unserer ` +
    `<a href="/datenschutzerklaerung">Datenschutzerklärung</a> und der ` +
    `<a href="${esc(m.privacy)}" target="_blank" rel="noopener noreferrer">Datenschutzerklärung von ${esc(m.label)}</a>.</p>` +
    `<button type="button" class="ce-load btn btn-cyan">${esc(m.label)} laden</button>` +
    `<label class="ce-remember"><input type="checkbox" class="ce-always" /> ${esc(m.label)} künftig immer laden</label>` +
    `</div></div></figure>`
  );
}
