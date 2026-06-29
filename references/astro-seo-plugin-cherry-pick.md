# NicoSKOOL/astro-seo-website-builder — Cherry-pick list (Option C)

**Source repo:** https://github.com/NicoSKOOL/astro-seo-website-builder (author: savvity / Nicolas Gorrono — same author as `local-business-builder`)
**Local clone:** `C:\Users\TomTim\astro-seo-inspect`
**Decision (2026-06-20):** Use as **reference only** (Option C). Do NOT run `/build-website` as the builder; build our own German, migration-first, Hetzner-static, custom-CSS MedSpace site and lift the good stack-agnostic bits below. (Option B — fork & retarget the whole plugin — deferred to a possible future 2nd practice site for a different audience.)

> Verdict basis: 5 of 9 locked constraints collide structurally (URL/image migration, Cloudflare, Tailwind, single-location/real-photos are **incompatible**; Resend, GSAP, comments/WebMCP/GEO gaps **need-change**). German is the *easy* axis (medium effort) and the only part originally asked for. Post-hoc patching a greenfield generator into a 1:1 migration is harder than not generating it. Same reasoning that rejected the sibling `local-business-builder` template.

---

## ✅ TAKE — reusable, stack-agnostic craft

1. **SEO copy rules** (`seo-writer.md`): keyword-in-H1, meta-description formula, 3-CTA model, anti-filler discipline, topics-over-keyphrases, lead-with-the-point. → **retune thresholds for German**, swap English plumber/electrician exemplars for German dental ones, Sie-form.
2. **Schema components + XSS-safe JSON-LD pattern** (`tech-builder.md`): `set:html={JSON.stringify(schema)}`, **never** string-interpolate into JSON-LD. Required-field enumerations for LocalBusiness (name/url/telephone/email/PostalAddress/openingHoursSpecification), BreadcrumbList (position ints from 1), FAQ (min 2 Q/A). → change `@type` to **Dentist/MedicalClinic**, add `inLanguage:'de'`.
3. **Form-hardening logic** (transport-agnostic): honeypot (`tabindex=-1`), server-side required-field validation, server-side honeypot re-check, email-format validation, loading state, inline success/error without reload. → reuse for our **SMTP** function (drop Resend).
4. **Content-completeness rubric + content.config.ts Zod discipline** (`.min/.max`) → retune to German lengths; map onto Markdown-in-Git + Sveltia frontmatter.
5. **PASS/FAIL audit-harness pattern** (`seo-auditor.md`): explicit HARD FAILs, file:line evidence, "read every file, don't audit from memory", re-audit only previously-failed items, structured Summary/HARD FAILS/Standard/Warnings/Verdict report. → **retarget** to German + URL-preservation + add llms.txt/WebMCP/GEO-citability checks (the plugin audits none of these).
6. **Alt-text rules** (5–15 words, describe actual content, not "image of"/"photo of") → German equivalents ("Bild von"/"Foto von"); use for the **189 preserved images'** German alt text.
7. **a11y / CWV checks** (stack-agnostic): exactly one H1, no skipped heading levels, unique per-page H1, explicit width/height (CLS), hero `eager`+`fetchpriority=high`, non-hero `lazy`, `prefers-reduced-motion`.
8. **llms.txt skeleton** (`tech-builder.md` 1051–1073) → translate to DE, single-location.
9. **Phased orchestration pattern** (confirm-gate interview → parallel build → design review → audit-until-PASS loop) — as a *process model* for our own build, not the command.

## ❌ AVOID — do not drag in

- Cloudflare adapter / `wrangler.jsonc` / `output:'hybrid'` → we use `output:'static'` + Hetzner (nginx/Caddy, Let's Encrypt).
- Tailwind + the gradient/glass/bento/oversized-display aesthetic → our **locked MedSpace custom CSS** (cyan #00bcd4 / navy #2b354b / all-Inter / ~9px square buttons; mockup in `design-mockup/`).
- Resend → **SMTP** (SPF/DKIM/DMARC).
- nano-banana AI image generation (Step 7) + `<Image>` reprocessing + the "no `<img>` tag" HARD FAIL → **mirror 189 real photos 1:1** at original URLs.
- Programmatic `/services/[slug]` + `/locations/[slug]` routes + trailing-slash sitemap → explicit routes / `getStaticPaths` preserving **62 legacy URLs**, `trailingSlash:'never'`, `build.format:'file'`.
- Multi-location / city-mention apparatus (Q3, locations collection, "name the city 2×") → single location.
- English char thresholds (title 50–60, meta 140–160, word bands) → German-aware.
- Hard-sell superlative CTA bank ("Join 5,000+ happy customers", "Don't Let X Ruin Your Week") → HWG/UWG-compliant German register.
- Deprecated `@astrojs/image`, GSAP weight → native `astro:assets`, minimal CSS transitions (PSI 100/100).

## ➕ GAPS the plugin can't help with (build from scratch)
- Comments: Git-stored Markdown/JSON, moderated in Sveltia, one-time importer for the **48 WP comments**.
- WebMCP (search_site + Termin tool) + Permissions-Policy.
- Zipchat AI widget (id `nb6GJQKgoBT35JAPhvUd`).
- GEO / AI-citability audit.
- URL + image migration tooling.

---
**Pairs with:** `astro-seo-joost-checklist.md` (Joost de Valk's Astro-SEO guide — the positive blueprint) and `references/local-business-builder/` (same-author code patterns).
