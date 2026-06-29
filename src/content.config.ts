import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

// Ratgeber (blog) — Markdown in Git, editable later via Sveltia CMS.
// Migrated 1:1 from the WordPress posts; URLs preserved (/ratgeber/<slug>).
const ratgeber = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/ratgeber' }),
  schema: ({ image }) =>
    z.object({
      title: z.string().max(120),
      description: z.string().max(260),
      category: z.string(), // Thema label, e.g. "Gesunde Zähne"
      categorySlug: z.string(), // e.g. "gesunde-zaehne"
      date: z.coerce.date(),
      updated: z.coerce.date().optional(),
      hero: z.string().optional(), // /wp-content/uploads/... (mirrored 1:1)
      heroAlt: z.string().optional(),
      author: z.string().default('Dr. Natalia Ehrlichmann'),
      readingTime: z.string().optional(),
      legacyId: z.number().optional(), // WP post id (for comment mapping)
      draft: z.boolean().default(false),
    }),
});

// Static content pages (Leistungen tree, Praxis, legal, misc) — migrated 1:1.
// Each carries its full URL path so the catch-all route preserves existing URLs.
const pages = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/pages' }),
  schema: z.object({
    title: z.string(),
    description: z.string().max(280).optional(),
    path: z.string(),
    parentTitle: z.string().optional(),
    parentPath: z.string().optional(),
    hero: z.string().optional(),
    heroAlt: z.string().optional(),
    legacyId: z.number().optional(),
    noindex: z.boolean().default(false), // thin quiz-result pages: keep URL, drop from index/sitemap
  }),
});

export const collections = { ratgeber, pages };
