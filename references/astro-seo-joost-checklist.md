# Astro SEO — Joost de Valk (Yoast founder) — Build Checklist

**Source:** https://joost.blog/astro-seo-complete-guide/
**Captured:** 2026-06-20 · **Use:** durable reference for the dr-ehrlichmann.de Astro build & SEO optimization phase.
**Also taught to:** the `otto` SEO-analyst agent (condensed) so it advises consistently.

---

## ⚠️ Project-specific adaptation (READ FIRST)

This guide is written for a Cloudflare/Netlify/Vercel + greenfield context. Our project differs — apply with these overrides:

- **Host = Hetzner VPS, NOT Cloudflare.** Items that rely on Cloudflare/Netlify (`_redirects` file, `No-Vary-Search` header, Cloudflare Transform Rule for markdown content-negotiation, `_headers`) must be re-implemented as **nginx/Caddy** equivalents (rewrites, `add_header`, `location` blocks, Let's Encrypt TLS).
- **Migration, not greenfield.** We **preserve 62 existing page URLs (NO trailing slash) + 189 image URLs (`/wp-content/uploads/` 1:1), NO redirects.** So: set `trailingSlash: 'never'` + `build.format: 'file'`; do NOT auto-rewrite/optimize images through Astro `<Image>` if it changes the path/filename — mirror the originals verbatim. The "comprehensive redirects / FuzzyRedirect" advice applies only to genuinely new/changed URLs, never to the preserved set.
- **German content.** Char thresholds below are English-tuned — German compounds run ~30% longer. Relax title/description/word-count limits accordingly. `inLanguage: 'de'`, `lang="de"`, hreflang `de`.
- **Single location** dental practice — no programmatic services×cities pages.
- **HWG/UWG compliance** — no superlative hard-sell copy; run content through `humanizer-de` + `zahnarzt-artikel-ehrlichmann`.
- **PageSpeed 100/100 goal** — be conservative with client JS (the guide's "zero JS by default" aligns; avoid GSAP/heavy animation).

---

## 1. Site Architecture & URL Structure
- One taxonomy, not two (categories OR tags, not both).
- Enforce SEO fields via **Zod** in content collections (title 5–120, description 15–160) — fail the build, not runtime. (Retune for German.)
- Typed content collections instead of DB taxonomies — misformed entries fail the build.
- Fix trailing-slash inconsistencies before launch via build-time internal-link validation. **(For us: enforce no-trailing-slash to match legacy URLs.)**
- Maintain redirects only for genuinely moved URLs (`_redirects`/`vercel.json` → **for us: nginx/Caddy**). **Never redirect a preserved URL.**
- FuzzyRedirect for 404s (>85% similarity auto-redirect, else "Did you mean…").

## 2. Technical SEO
### Sitemaps & Indexing
- Split sitemaps by content type with `@astrojs/sitemap` `chunks` option (posts/pages/etc.) — easier GSC debugging.
- `lastmod` from **git history** (`git log` last-commit), not frontmatter/file mtime.
- **IndexNow** via `@jdevalk/astro-seo-graph` — push all URLs to Bing/Yandex after build.
- Schema map at `/schemamap.xml`, advertised in `robots.txt` (`Schemamap:` directive).
- RSS feed with **full** post content via `@astrojs/rss`; advertise with `<link rel="alternate" type="application/rss+xml">`.
### Robots & Crawlability
- Dynamic `robots.txt` referencing sitemap index + schema map, permissive by default.
- Strip UTM params from canonical URLs.
- Robots meta: `max-snippet:-1, max-image-preview:large, max-video-preview:-1`.
- Omit canonical when `noindex` is true.
- `No-Vary-Search` header to ignore UTM in cache keys. **(For us: nginx equivalent.)**
### Validation (build-time)
- Validate all internal links at build (catch typos + 301 chains).
- External link checker in CI (Lychee GitHub Action), weekly for link-rot.
- H1 validation: warn on zero or multiple `<h1>`.
- Image alt-text validation across the whole site.
- Metadata length validation (title 30–65, description 70–200 — **retune for German**).

## 3. On-Page
- Single `<Seo>` component for all head tags (e.g. `@jdevalk/astro-seo-graph`) — no scattered meta.
- Validate title/description **uniqueness** across all built pages (catch paginated dupes).
- Titles/descriptions **for humans / CTR**, not exact-match keywords (search is vectorized).
- Lead with the point: first sentence of every paragraph states its main idea (AI extracts it).
- Sentences < 20 words; one idea per paragraph; use transitions; cut filler ("basically/simply/really/just").
- Topics over keyphrases.
- Internal linking: automate discovery (knowledge graph / Graphify); breadcrumbs linked to schema entities by `@id`; link to real content, not redirects.

## 4. Structured Data / Schema.org
- Single `<Seo>` component consolidates title/desc/canonical/OG/Twitter/hreflang/JSON-LD.
- Emit a linked `@graph` (WebSite, Blog, Person, WebPage, BlogPosting, BreadcrumbList, ImageObject) wired via `@id`. **(For us: @type Dentist/MedicalClinic, inLanguage:'de'.)**
- Validate JSON-LD at build.
- Trust signals: `publishingPrinciples`, `copyrightHolder`, `copyrightYear`, `knowsAbout`.
- `SearchAction` on WebSite entity.
- Corpus schema endpoints (`/schema/post.json`, `/schema/page.json`) for agents.
- `articleBody` (markdown-stripped, up to 10K chars) in schema.
- **Agent discovery:** markdown alternates via `createMarkdownEndpoint()` + `<link rel="alternate" type="text/markdown">`; content-negotiation for `Accept: text/markdown` (**for us: nginx rewrite**); `/llms.txt` via `seoGraph({ llmsTxt })`; `<link rel="nlweb">` (Microsoft NLWeb). Validate with ClassySchema / Rich Results Test.

## 5. Performance & Core Web Vitals
- Static by default — pre-render every page; no SSR/DB.
- Zero JS by default; add interactive components only where needed.
- `<Image>` for responsive `srcset` + WebP + lazy/async. **(For us: do NOT let it rewrite preserved `/wp-content/uploads/` paths.)**
- Preload primary web font (woff2) in `<head>`. **(Our font: Inter.)**
- View Transitions `defaultStrategy: 'viewport'` for prefetch-on-scroll.
- Hashed asset caching: `/_astro/` → `Cache-Control: public, max-age=31536000, immutable`.
- CDN/cache headers per platform. **(For us: nginx `add_header`.)**

## 6. Content & E-E-A-T
- Experience/Expertise: author bylines, credentials, publication context in schema.
- Authoritativeness: topical clusters via internal linking; `knowsAbout`.
- Trustworthiness: `publishingPrinciples`, editorial policy, author info, copyright.
- Originality + write-for-extraction (self-contained paragraphs).
- Use a readability check against sentence length / filler / structure / transitions.

## 7. Astro-Specific Packages & Config
| Package | Purpose |
|---|---|
| `@jdevalk/astro-seo-graph` | Seo component, schema endpoints, IndexNow, llms.txt, validation, FuzzyRedirect |
| `@astrojs/sitemap` | Per-collection sitemaps (`chunks`), git-based `lastmod` (`serialize`) |
| `@astrojs/rss` | RSS (full content) |
| `satori` + `sharp` | Auto OG images (1200×675 **JPEG** — social doesn't reliably do WebP/AVIF) |
| `astro-pagefind` | Client-side search wired to schema `SearchAction` |
| GitHub Actions (Lychee) | Broken-link detection in CI |

- Content collections + Zod `seoSchema()`; auto-derive OG image from slug; hreflang via `<Seo>` `alternates`.
- Drop deprecated `@astrojs/image` → use native `astro:assets`.
- Suppress redundant Twitter tags (fall back to OG).
- Run all 6 build-time checks (H1, dup title/desc, schema, alt, metadata length, internal links); fail build on errors.

## 8. Analytics & Monitoring
- Google Search Console (per-collection sitemaps ease debugging) → **Otto's home turf.**
- Bing Webmaster Tools (feeds Copilot/ChatGPT — agent visibility).
- Privacy-friendly analytics (we already run GA4 `G-QBYF4KW6NY`).
- Rich Results Test + ClassySchema for JSON-LD graph validation.

---

**Core principle:** make content accessible to humans *and* machines — structure for meaning, keep the stack fast. Modern SEO = AI readers parse markdown, extract paragraphs, walk knowledge graphs, not just crawl links.
