# Design

Visual system of dr-ehrlichmann.de (Astro rebuild). Source of truth: `src/styles/global.css` tokens. Design is LOCKED (MedSpace direction) — polish within it, never replace it.

## Theme

Light, white-dominant, medical-clean with warmth. One dark navy CTA band + navy quiz headers as deliberate contrast moments; everything else stays light.

## Color

- `--c500 #00bcd4` — bright cyan brand accent (icons, borders, decoration ONLY; fails AA with white text)
- `--c600 #0097ad` / `--c700 #057a8d` — interactive cyan (links, buttons, active chips; `--c700` = white-text-safe)
- `--c50 #e6f7fa` / `--c100 #cdeef5` — cyan tints (chips, soft cards, sidebar CTA)
- `--navy #2b354b`, `--navy-deep #1f2738`, `--navy-700 #3a4663` — dark bands, footer, quiz header
- `--g500 #8bc34a` / `--g600 #5e8e2c` / `--g50 #f0f9f1` — green (primary CTA accents, open-now dot)
- `--n50/--n100/--n200` — neutral section tints; `--ink #1f2738`, `--body #414b59`, `--muted #5b6673`, `--line #e7edf1`
- `--gold #f5a623` — review stars

## Typography

ALL Inter (`Inter Variable`, self-hosted via @fontsource). No serif anywhere (owner rejected). h1/h2 weight 700 (hero h1 ~600), letter-spacing -.02em; body 17px/1.65. Eyebrow: 700, .78rem, uppercase, tracked, `--c600`.

## Components

- **Buttons:** square-ish radius 9px, never pills. `.btn-primary`/`.btn-cyan` = `--c700` fill; `.btn-ghost` white + hairline.
- **Cards:** radius `--r 18px`–`--r-lg 24px`, hairline `--line` border, soft cyan-tinted shadows (`--shadow-sm/--shadow/--shadow-lg`).
- **Chips:** pill-shaped ONLY for tags/chips (`.chip`, `.themen`); active state = `--c700` bg + white + `aria-current`.
- **Sidebar widgets** (articles/services): light cards; CTA widget `.widget.cta-w` = light-cyan variant (Variant A, chosen 2026-06-24).
- **Quiz** (`.quiz*`): navy header band (`.quiz-top`), light body; in-article scoped overrides keep intro text light on navy.
- **Galleries:** `.gallery` mosaic (1 lead + small), `.gallery--pair` (2 equal 3:2), `.gallery--grid2` (2×2), `.g-cap` overlay caption (bottom scrim + white semibold). Tiles: 14px radius, hairline, hover-zoom, GLightbox.
- **Reviews rail:** CSS scroll-snap, 0 JS, source badges (`role="img"`), `tabindex="0"` + focus ring.

## Layout & Motion

`--wrap 1280px`, 32px gutters. Reveal-on-scroll gated on `.js` (content visible without JS). Ease `cubic-bezier(.22,.61,.36,1)`, hover lifts -2px, `prefers-reduced-motion` kills all.

## Hard invariants

0 external resources in dist; AA contrast; identical legacy URLs (no trailing slash) and `/wp-content/uploads/` image paths; build must pass `node scripts/check-links.mjs`.
