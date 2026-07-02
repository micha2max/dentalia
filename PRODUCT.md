# Product

## Register

brand

## Users

Patients (and prospective patients) of Zahnarztpraxis Dr. Natalia Ehrlichmann in Neunkirchen-Seelscheid — mostly local families, anxious patients (Angstpatienten), parents researching children's dental topics, and older patients on prostheses. They arrive from Google/AI search, often on mobile, looking for a symptom answer, a service explanation, or a quick way to request an appointment (Terminanfrage) or call.

## Product Purpose

Static Astro rebuild of dr-ehrlichmann.de (replacing WordPress) with identical URLs/images, PageSpeed 100/100, zero external calls, WCAG-AA, agent-ready (llms.txt, WebMCP, schema). Success = keep/improve Google rankings, attract patients, make the practice look trustworthy and premium.

## Brand Personality

Calm, competent, caring. Medical cleanliness with warmth — "premium but human", never clinical-cold, never salesy. German, patient-first tone (symptom-first navigation: "Was tut weh?").

## Anti-references

- Dark-theme "premium agency" looks — REJECTED by owner.
- Serif display headings (Fraunces/Playfair/Newsreader) — tried and REJECTED.
- Pill buttons — rejected; buttons are square-ish (9px radius).
- Blob heroes and icon "plus" affordances — explored and rejected.
- Generic AI-SaaS gradients, glassmorphism-as-default, cream/beige body backgrounds.

## Design Principles

1. **Locked design system wins.** MedSpace-style: white-dominant, cyan accent, navy bands, green CTA, all-Inter. Do not re-litigate; polish within it.
2. **Patient-first clarity.** Every block answers a patient question before it decorates.
3. **Trust through realness.** Real practice photos, real Google/Facebook reviews, real doctor Q&A — no stock-photo feel, no invented numbers.
4. **Performance & privacy are design.** 0 external resources, self-hosted fonts, PSI 100 — nothing may compromise this.
5. **Accessible by default.** AA contrast everywhere (interactive cyan = --c700 on white), focus rings, reduced-motion fallbacks.

## Accessibility & Inclusion

WCAG 2.1 AA. Verified axe-clean across 18 page archetypes (2026-07-01). Rules learned: icon-only labelled elements need `role="img"`; scrollable rails need `tabindex="0"` + focus ring; white-text highlights use `--c700`, never `--c500`. `prefers-reduced-motion` honored globally.
