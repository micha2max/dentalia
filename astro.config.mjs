// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import remarkFixLinks from './src/lib/remark-fix-links.mjs';
import remarkGalleries from './src/lib/remark-galleries.mjs';
import remarkConsentEmbeds from './src/lib/remark-consent-embeds.mjs';
import remarkLesetipp from './src/lib/remark-lesetipp.mjs';
import remarkLeistungRelated from './src/lib/remark-leistung-related.mjs';
import remarkExpertNote from './src/lib/remark-expert-note.mjs';

// Static site for dr-ehrlichmann.de — migration of the existing WordPress site.
// HARD RULE: preserve existing URLs 1:1 with NO trailing slash and NO redirects.
//   trailingSlash:'never' + build.format:'file' => /leistungen (not /leistungen/).
// Images are mirrored verbatim under public/wp-content/uploads/ (same paths).
// Deploy target: Hostinger VPS (static, nginx), not Cloudflare. See deploy/.
export default defineConfig({
  site: 'https://dr-ehrlichmann.de',
  trailingSlash: 'never',
  build: { format: 'file' },
  compressHTML: true,
  prefetch: { prefetchAll: true, defaultStrategy: 'viewport' },
  markdown: { remarkPlugins: [remarkFixLinks, remarkGalleries, remarkConsentEmbeds, remarkLesetipp, remarkLeistungRelated, remarkExpertNote] },
  // Thin quiz-result pages keep their URLs but are noindex'd — keep them out of the sitemap too.
  integrations: [sitemap({ filter: (page) => !page.includes('/ihre-zahngesundheit-testergebins-') })],
});
