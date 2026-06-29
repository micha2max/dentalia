# Local Business Website Builder: Technical Reference Guide

This is the complete technical reference for building SEO-optimized local service business websites. The site-builder agent must follow every instruction in this document exactly. No exceptions.

---

## Table of Contents

1. [Writing Preferences](#1-writing-preferences)
2. [Project Architecture](#2-project-architecture)
3. [Astro 5 Rules](#3-astro-5-rules-critical)
4. [Tailwind CSS v4 Rules](#4-tailwind-css-v4-rules-critical)
5. [URL Structure](#5-url-structure)
6. [SEO Requirements](#6-seo-requirements)
7. [Schema Markup](#7-schema-markup)
8. [Internal Linking Strategy](#8-internal-linking-strategy)
9. [Design System](#9-design-system)
10. [Color Psychology by Industry](#10-color-psychology-by-industry)
11. [Data Architecture](#11-data-architecture)
12. [Page Templates](#12-page-templates)
13. [Content Guidelines](#13-content-guidelines)
14. [Image Strategy](#14-image-strategy)
15. [Deployment](#15-deployment)
16. [Build Checklist](#16-build-checklist)

---

## 1. Writing Preferences

- Never use em dashes in writing. Use colons, commas, parentheses, or separate sentences instead.
- Never fabricate reviews or testimonials. Use only real customer data or clearly label placeholders with comments like `// PLACEHOLDER: Replace with real reviews`.
- Write all content at an 8th-grade reading level. Use short sentences. Avoid jargon unless defining it.
- Spell out numbers under 10. Use numerals for 10 and above.
- Always use the business's actual phone number in CTAs, never a placeholder.
- When writing FAQs, answer in 2-3 sentences. Include the business name and phone number in at least two answers.

---

## 2. Project Architecture

### Tech Stack (Non-Negotiable)

| Tool | Version | Purpose |
|------|---------|---------|
| Astro | 5.x | Static site generator with file-based routing |
| Tailwind CSS | v4 | CSS-native config via @theme, @utility, @layer |
| Cloudflare Pages | - | Free hosting with global CDN + Workers for SSR routes |
| astro-icon | 1.x | Lucide icons as optimized SVGs |
| @astrojs/sitemap | 3.x | Auto-generated XML sitemap |

### Dependencies

```bash
npm create astro@latest -- --template minimal
npm install @astrojs/cloudflare @astrojs/sitemap @tailwindcss/vite @tailwindcss/typography tailwindcss astro-icon
npm install -D @iconify-json/lucide
```

### Folder Structure

```
project-root/
├── astro.config.mjs
├── tsconfig.json
├── package.json
├── public/
│   ├── favicon.ico
│   ├── favicon.svg
│   ├── robots.txt
│   └── images/
│       ├── hero.webp
│       └── [service-slug].webp
├── src/
│   ├── content.config.ts          # Astro 5 content collection schemas
│   ├── content/
│   │   └── blog/                  # Markdown blog posts
│   ├── components/
│   │   ├── SEO.astro              # Head meta, OG, Twitter, JSON-LD
│   │   ├── Header.astro           # Sticky nav with phone CTA
│   │   ├── Footer.astro           # Footer with sitemap links
│   │   ├── Breadcrumbs.astro      # Breadcrumb nav + schema
│   │   ├── SeoFaq.astro           # FAQ accordion + FAQPage schema
│   │   ├── SeoRelatedLinks.astro  # Internal link clusters
│   │   ├── SeoServiceAreas.astro  # Area cross-links
│   │   └── SeoTestimonials.astro  # Review cards
│   ├── data/
│   │   ├── business.ts            # Business info, hours, credentials
│   │   ├── serviceAreas.ts        # Geographic areas with coords
│   │   ├── serviceTypes.ts        # Services with descriptions, prices
│   │   └── seoContent.ts          # FAQ generator, reviews, helpers
│   ├── layouts/
│   │   └── BaseLayout.astro       # HTML shell with head + header/footer
│   ├── lib/
│   │   └── urls.ts                # URL builder functions
│   ├── pages/
│   │   ├── index.astro            # Homepage
│   │   ├── about.astro            # About page
│   │   ├── contact.astro          # Contact page with form
│   │   ├── services/
│   │   │   ├── index.astro        # Services listing
│   │   │   ├── [service].astro    # Individual service pages
│   │   │   └── [area]/
│   │   │       └── [service].astro # Combination pages (THE MONEY PAGES)
│   │   ├── areas/
│   │   │   ├── index.astro        # Areas listing
│   │   │   └── [area].astro       # Individual area pages
│   │   └── blog/
│   │       ├── index.astro        # Blog listing
│   │       └── [slug].astro       # Individual blog posts
│   └── styles/
│       └── global.css             # Tailwind v4 theme + custom styles
```

### astro.config.mjs Template

```javascript
// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import cloudflare from '@astrojs/cloudflare';
import sitemap from '@astrojs/sitemap';
import icon from 'astro-icon';

export default defineConfig({
  site: 'https://BUSINESS_DOMAIN.com',
  output: 'static',
  trailingSlash: 'always',

  integrations: [
    icon(),
    sitemap({
      filter: (page) =>
        !page.includes('/admin/') && !page.includes('/api/'),
      changefreq: 'weekly',
      priority: 0.7,
    }),
  ],

  vite: {
    plugins: [tailwindcss()],
  },

  adapter: cloudflare(),
});
```

---

## 3. Astro 5 Rules (CRITICAL)

These rules are non-negotiable. Violating any of them will cause build failures.

| Rule | Correct | Wrong |
|------|---------|-------|
| Output mode | `output: 'static'` | `output: 'hybrid'` (removed in Astro 5) |
| SSR routes | `export const prerender = false` per route | `output: 'hybrid'` |
| Tailwind integration | `vite: { plugins: [tailwindcss()] }` | `integrations: [tailwind()]` |
| Tailwind config | All in `global.css` via `@theme` | `tailwind.config.js` (does not exist) |
| Trailing slashes | `trailingSlash: 'always'` | No trailing slash setting |
| Content collection config | `src/content.config.ts` | `src/content/config.ts` |
| Content collection loader | `glob()` from `astro/loaders` | Old API |
| Rendering collections | `render()` from `astro:content` | `entry.render()` |

### Content Collection Example

```typescript
// src/content.config.ts
import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const blog = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/blog' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    publishDate: z.string(),
    author: z.string().default('Business Name'),
    category: z.enum(['tips', 'maintenance', 'news', 'guides']),
    tags: z.array(z.string()).default([]),
    readingTime: z.string().optional(),
    featured: z.boolean().default(false),
  }),
});

export const collections = { blog };
```

### Rendering Blog Posts

```astro
---
// src/pages/blog/[slug].astro
import { getCollection, render } from 'astro:content';
import BaseLayout from '../../layouts/BaseLayout.astro';

export async function getStaticPaths() {
  const posts = await getCollection('blog');
  return posts.map((post) => ({
    params: { slug: post.id },
    props: { post },
  }));
}

const { post } = Astro.props;
const { Content } = await render(post);
---

<BaseLayout title={post.data.title} description={post.data.description}>
  <article class="prose-editorial mx-auto max-w-3xl px-5 py-16">
    <h1>{post.data.title}</h1>
    <Content />
  </article>
</BaseLayout>
```

---

## 4. Tailwind CSS v4 Rules (CRITICAL)

These are Tailwind v4 breaking changes from v3. Every rule must be followed.

| Rule | Detail |
|------|--------|
| No config file | There is NO `tailwind.config.js`. All tokens go in `@theme` in CSS |
| Plugin loading | `@plugin "@tailwindcss/typography"` (not JS import) |
| @utility restrictions | `@utility` CANNOT have pseudo-selectors (`:hover`, `::after`, `::before`) |
| Hover/focus states | Use `@layer components` for hover states, NOT `@utility` |
| space-y-* bug | `space-y-*` is unreliable for large values. Use explicit `mt-*` on children |
| Import syntax | `@import "tailwindcss"` at top of CSS file |

### global.css Structure Template

```css
@import "tailwindcss";
@plugin "@tailwindcss/typography";

@theme {
  /* Typography */
  --font-display: 'Display Font', 'Georgia', serif;
  --font-body: 'Body Font', 'Helvetica Neue', sans-serif;

  /* Brand palette */
  --color-brand-50: #VALUE;
  --color-brand-100: #VALUE;
  --color-brand-200: #VALUE;
  --color-brand-300: #VALUE;
  --color-brand-400: #VALUE;
  --color-brand-500: #VALUE;
  --color-brand-600: #VALUE;
  --color-brand-700: #VALUE;
  --color-brand-800: #VALUE;
  --color-brand-900: #VALUE;
  --color-brand-950: #VALUE;

  /* Neutral stone palette */
  --color-stone-50: #fafaf9;
  --color-stone-100: #f9f7f6;
  --color-stone-200: #f5f5f4;
  --color-stone-300: #e7e5e4;
  --color-stone-400: #d6d3d1;
  --color-stone-500: #a8a29e;
  --color-stone-600: #78716c;
  --color-stone-700: #57534e;
  --color-stone-800: #44403c;
  --color-stone-900: #292524;
  --color-stone-950: #1c1917;

  /* Accent */
  --color-amber-400: #fbbf24;
  --color-amber-500: #f59e0b;
  --color-amber-600: #d97706;

  /* Animations */
  --animate-fade-up: fadeUp 0.6s ease-out both;
  --animate-fade-in: fadeIn 0.6s ease-out both;
  --animate-slide-down: slideDown 0.4s ease-out both;
  --animate-scale-in: scaleIn 0.5s ease-out both;
}

@keyframes fadeUp {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes slideDown {
  from { opacity: 0; transform: translateY(-10px); }
  to { opacity: 1; transform: translateY(0); }
}

@keyframes scaleIn {
  from { opacity: 0; transform: scale(0.95); }
  to { opacity: 1; transform: scale(1); }
}

/* Stagger utilities (animation-delay) - safe in @utility */
@utility stagger-1 { animation-delay: 0.05s; }
@utility stagger-2 { animation-delay: 0.10s; }
@utility stagger-3 { animation-delay: 0.15s; }
@utility stagger-4 { animation-delay: 0.20s; }
@utility stagger-5 { animation-delay: 0.25s; }
@utility stagger-6 { animation-delay: 0.30s; }

/* Glass morphism */
@utility glass {
  background: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
}

/* Editorial line accent */
@utility editorial-line {
  position: relative;
  padding-left: 1.5rem;
  border-left: 3px solid var(--color-brand-500);
}

/* HOVER AND PSEUDO-SELECTOR STYLES GO HERE, NEVER IN @utility */
@layer components {
  .card-hover {
    transition: transform 0.3s ease, box-shadow 0.3s ease;
  }
  .card-hover:hover {
    transform: translateY(-4px);
    box-shadow: 0 12px 24px -8px rgba(0, 0, 0, 0.15);
  }

  .prose-editorial {
    font-family: var(--font-body);
    line-height: 1.75;
    color: var(--color-stone-700);
  }
  .prose-editorial h2 {
    font-family: var(--font-display);
    color: var(--color-brand-900);
    margin-top: 2.5rem;
    margin-bottom: 1rem;
    font-size: 1.5rem;
    line-height: 1.3;
  }
  .prose-editorial h3 {
    font-family: var(--font-display);
    color: var(--color-brand-800);
    margin-top: 2rem;
    margin-bottom: 0.75rem;
    font-size: 1.25rem;
    line-height: 1.4;
  }
  .prose-editorial p {
    margin-bottom: 1.25rem;
  }
  .prose-editorial a {
    color: var(--color-brand-600);
    text-decoration: underline;
    text-underline-offset: 2px;
  }
  .prose-editorial a:hover {
    color: var(--color-brand-800);
  }
  .prose-editorial ul,
  .prose-editorial ol {
    margin-bottom: 1.25rem;
    padding-left: 1.5rem;
  }
  .prose-editorial li {
    margin-bottom: 0.5rem;
  }
  .prose-editorial blockquote {
    border-left: 3px solid var(--color-brand-400);
    padding-left: 1.25rem;
    color: var(--color-stone-600);
    font-style: italic;
    margin: 1.5rem 0;
  }
}
```

---

## 5. URL Structure

Every page must follow this exact URL pattern. All URLs must end with a trailing slash.

| Page Type | URL Pattern | Example |
|-----------|-------------|---------|
| Homepage | `/` | `/` |
| Services index | `/services/` | `/services/` |
| Single service | `/services/[service-slug]/` | `/services/leak-repair/` |
| Areas index | `/areas/` | `/areas/` |
| Single area | `/areas/[area-slug]/` | `/areas/brenham/` |
| Combination | `/services/[area-slug]/[service-slug]/` | `/services/brenham/leak-repair/` |
| About | `/about/` | `/about/` |
| Contact | `/contact/` | `/contact/` |
| Blog index | `/blog/` | `/blog/` |
| Blog post | `/blog/[slug]/` | `/blog/how-to-prevent-frozen-pipes/` |

### URL Builder Functions

```typescript
// src/lib/urls.ts
export const serviceUrl = (serviceSlug: string) => `/services/${serviceSlug}/`;
export const areaUrl = (areaSlug: string) => `/areas/${areaSlug}/`;
export const comboUrl = (areaSlug: string, serviceSlug: string) =>
  `/services/${areaSlug}/${serviceSlug}/`;
export const contactUrl = () => '/contact/';
export const aboutUrl = () => '/about/';
export const blogUrl = (slug?: string) => (slug ? `/blog/${slug}/` : '/blog/');
```

---

## 6. SEO Requirements

### Title Tags

- Maximum 60 characters including the business name
- Format for combo pages: `[Service] in [Area], [State] | [Business Name]`
- Format for service pages: `[Service] Services | [Business Name]`
- Format for area pages: `[Business Type] in [Area], [State] | [Business Name]`
- Homepage: `[Business Name] | [City] [State] [Business Type]`

### Meta Descriptions

- 140-155 characters
- Must include the phone number as a CTA
- Must include the area name and service name where applicable
- Format: `Need [service] in [area]? [Business Name] offers [value prop]. Call [phone].`

### Per-Page Requirements

- One H1 per page (never more)
- Every page must have: title, meta description, canonical URL, OG tags, Twitter card
- JSON-LD schema markup on every page (see Section 7)
- All images must have descriptive alt text
- Canonical URLs must be absolute (include the full domain)

### Head Template

```astro
---
// src/components/SEO.astro
interface Props {
  title: string;
  description: string;
  canonicalUrl?: string;
  ogImage?: string;
  schema?: Record<string, unknown> | Record<string, unknown>[];
  noindex?: boolean;
}

const SITE_NAME = 'Business Name Here';
const DEFAULT_OG_IMAGE = '/og-default.webp';

const {
  title: rawTitle,
  description,
  canonicalUrl,
  ogImage,
  schema,
  noindex = false,
} = Astro.props;

const title = rawTitle.includes(SITE_NAME)
  ? rawTitle
  : `${rawTitle} | ${SITE_NAME}`;

const canonical = canonicalUrl || new URL(Astro.url.pathname, Astro.site).href;
const ogImageUrl = new URL(ogImage || DEFAULT_OG_IMAGE, Astro.site).href;
---

<title>{title}</title>
<meta name="description" content={description} />
<link rel="canonical" href={canonical} />

{noindex && <meta name="robots" content="noindex, nofollow" />}

<meta property="og:title" content={title} />
<meta property="og:description" content={description} />
<meta property="og:type" content="website" />
<meta property="og:url" content={canonical} />
<meta property="og:image" content={ogImageUrl} />
<meta property="og:site_name" content={SITE_NAME} />
<meta property="og:locale" content="en_US" />

<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:title" content={title} />
<meta name="twitter:description" content={description} />
<meta name="twitter:image" content={ogImageUrl} />

{schema && (
  <script type="application/ld+json" set:html={JSON.stringify(schema)} />
)}
```

---

## 7. Schema Markup

### Schema.org Type Mapping by Industry

Use the correct `@type` in JSON-LD based on the business industry. This is critical for Google's Knowledge Panel.

| Industry | Schema @type | Notes |
|----------|-------------|-------|
| Plumber | `Plumber` | Direct type |
| HVAC | `HVACBusiness` | Direct type |
| Electrician | `Electrician` | Direct type |
| Locksmith | `Locksmith` | Direct type |
| Roofing | `RoofingContractor` | Direct type |
| House Cleaning | `HousePainter` | Closest match; or use `HomeAndConstructionBusiness` |
| Landscaping | `LandscapingBusiness` | Use `HomeAndConstructionBusiness` with `additionalType` |
| Pest Control | `LocalBusiness` | With `additionalType: "PestControlService"` |
| Dentist | `Dentist` | Direct type |
| General Contractor | `GeneralContractor` | Direct type |
| Auto Repair | `AutoRepair` | Direct type |
| Moving Company | `MovingCompany` | Direct type |
| Lawyer / Attorney | `Attorney` | Direct type |
| Accountant | `AccountingService` | Direct type |
| Real Estate Agent | `RealEstateAgent` | Direct type |
| Veterinarian | `VeterinaryCare` | Direct type |
| Hair Salon / Barber | `HairSalon` or `BarberShop` | Direct types |
| Spa | `DaySpa` | Direct type |
| Restaurant | `Restaurant` | Direct type |
| Gym / Fitness | `HealthClub` | Direct type |
| Photography | `LocalBusiness` | With `additionalType` |
| Tutoring | `EducationalOrganization` | With `additionalType` |
| Pet Grooming | `LocalBusiness` | With `additionalType: "PetGrooming"` |
| Towing | `LocalBusiness` | With `additionalType: "TowingService"` |
| Tree Service | `LocalBusiness` | With `additionalType: "TreeRemovalService"` |
| Carpet Cleaning | `LocalBusiness` | With `additionalType: "CarpetCleaningService"` |
| Painting | `HousePainter` | Direct type |
| Flooring | `HomeAndConstructionBusiness` | With `additionalType` |
| Garage Door | `HomeAndConstructionBusiness` | With `additionalType` |
| Pressure Washing | `LocalBusiness` | With `additionalType` |
| Window Cleaning | `LocalBusiness` | With `additionalType` |
| Handyman | `HomeAndConstructionBusiness` | General category |
| Appliance Repair | `LocalBusiness` | With `additionalType: "ApplianceRepairService"` |

When no direct schema type exists, use `LocalBusiness` as the base type and add `additionalType` with the most specific URL from schema.org or a descriptive string.

### Homepage Schema (JSON-LD @graph)

The homepage must include a `@graph` array with three objects:

1. **WebSite** - with `url`, `name`, `description`, `publisher`
2. **[BusinessType]** - the full business entity with address, geo, hours, services catalog, areas served
3. **WebPage** - the page itself, linked to website and business

```typescript
const schema = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'WebSite',
      '@id': `${business.website}/#website`,
      url: business.website,
      name: business.name,
      description: business.description,
      publisher: { '@id': `${business.website}/#business` },
    },
    {
      '@type': business.schemaType, // e.g., 'Plumber', 'HVACBusiness', 'Dentist'
      '@id': `${business.website}/#business`,
      name: business.name,
      legalName: business.legalName,
      url: business.website,
      telephone: business.phone,
      email: business.email,
      description: business.description,
      founder: { '@type': 'Person', name: business.owner },
      foundingDate: `${business.yearEstablished}`,
      address: {
        '@type': 'PostalAddress',
        addressLocality: business.address.city,
        addressRegion: business.address.state,
        postalCode: business.address.zip,
        addressCountry: 'US',
      },
      geo: {
        '@type': 'GeoCoordinates',
        latitude: business.coordinates.lat,
        longitude: business.coordinates.lng,
      },
      openingHoursSpecification: [/* business hours */],
      areaServed: serviceAreas.map((area) => ({
        '@type': 'City',
        name: area.name,
        containedInPlace: {
          '@type': 'AdministrativeArea',
          name: area.county,
        },
      })),
      hasOfferCatalog: {
        '@type': 'OfferCatalog',
        name: 'Services',
        itemListElement: serviceTypes.map((service) => ({
          '@type': 'Offer',
          itemOffered: {
            '@type': 'Service',
            name: service.name,
            description: service.shortDescription,
          },
        })),
      },
    },
    {
      '@type': 'WebPage',
      '@id': `${business.website}/#webpage`,
      url: business.website,
      name: `${business.name} | ${business.address.city} ${business.address.state} ${business.schemaType}`,
      isPartOf: { '@id': `${business.website}/#website` },
      about: { '@id': `${business.website}/#business` },
      description: business.description,
    },
  ],
};
```

### Combination Page Schema

Every combo page (`/services/[area]/[service]/`) needs:

1. **Service** object linked to the business as `provider`
2. **BreadcrumbList** for breadcrumb rich results

```typescript
const schema = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'Service',
      '@id': `${business.website}${comboUrl(area.slug, service.slug)}#service`,
      name: `${service.name} in ${area.name}`,
      description: `${service.description} Serving ${area.name}, ${area.county} and surrounding communities.`,
      provider: {
        '@type': business.schemaType,
        '@id': `${business.website}/#business`,
        name: business.name,
        telephone: business.phone,
        url: business.website,
        address: { /* PostalAddress */ },
        geo: { /* GeoCoordinates */ },
        founder: { '@type': 'Person', name: business.owner },
        foundingDate: `${business.yearEstablished}`,
        hasCredential: {
          '@type': 'EducationalOccupationalCredential',
          credentialCategory: 'License',
          name: business.license,
        },
      },
      areaServed: [{
        '@type': 'City',
        name: area.name,
        containedInPlace: {
          '@type': 'AdministrativeArea',
          name: area.county,
        },
      }],
      offers: {
        '@type': 'AggregateOffer',
        lowPrice: service.priceRange.min,
        highPrice: service.priceRange.max,
        priceCurrency: 'USD',
      },
    },
    {
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: business.website },
        { '@type': 'ListItem', position: 2, name: 'Services', item: `${business.website}/services/` },
        { '@type': 'ListItem', position: 3, name: area.name, item: `${business.website}${areaUrl(area.slug)}` },
        { '@type': 'ListItem', position: 4, name: service.name },
      ],
    },
  ],
};
```

### FAQ Schema

Every page with FAQs must also include `FAQPage` schema:

```typescript
const faqSchema = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: faqs.map((faq) => ({
    '@type': 'Question',
    name: faq.question,
    acceptedAnswer: {
      '@type': 'Answer',
      text: faq.answer,
    },
  })),
};
```

---

## 8. Internal Linking Strategy

Internal linking is the single most important SEO factor for programmatic local sites. Follow these rules exactly.

### Combination Pages (highest priority)

Every combo page (`/services/[area]/[service]/`) must include:

1. **Other services in the same area**: Link to every other service available in the current area. If the page is "Leak Repair in Brenham," link to "Drain Cleaning in Brenham," "Water Heater Service in Brenham," etc.
2. **Same service in nearby areas**: Link to the same service in all nearby areas. If the page is "Leak Repair in Brenham," link to "Leak Repair in Bellville," "Leak Repair in Navasota," etc.

### Service Pages

Every service page (`/services/[service]/`) links to:
- All combo pages for that service (every area where you offer it)
- The contact page

### Area Pages

Every area page (`/areas/[area]/`) links to:
- All combo pages for that area (every service available there)
- All nearby area pages
- The contact page

### Blog Posts

Every blog post includes:
- 2-3 contextual links to relevant service pages
- 1-2 contextual links to relevant area pages
- At least 1 link to the contact page

### Link Component

```astro
---
// src/components/SeoRelatedLinks.astro
import type { ServiceArea } from '../data/serviceAreas';
import type { ServiceType } from '../data/serviceTypes';
import { serviceTypes } from '../data/serviceTypes';
import { serviceAreas, getAreaBySlug } from '../data/serviceAreas';
import { comboUrl, areaUrl } from '../lib/urls';

interface Props {
  area: ServiceArea;
  service?: ServiceType;
}

const { area, service } = Astro.props;

const otherServices = service
  ? serviceTypes.filter((s) => s.slug !== service.slug)
  : serviceTypes;

const nearbyAreas = area.nearby
  .map((slug) => getAreaBySlug(slug))
  .filter((a): a is ServiceArea => a !== undefined);
---

<nav aria-label="Related pages" class="mt-12 space-y-8">
  {otherServices.length > 0 && (
    <div>
      <h3 class="text-sm font-semibold uppercase tracking-wide text-stone-400">
        {service ? `Other services in ${area.name}` : `Services in ${area.name}`}
      </h3>
      <div class="mt-3 flex flex-wrap gap-2">
        {otherServices.map((s) => (
          <a
            href={comboUrl(area.slug, s.slug)}
            class="rounded-full border border-stone-200/60 bg-white px-3.5 py-1.5 text-xs font-medium text-stone-600 transition-all hover:border-brand-300 hover:bg-brand-50 hover:text-brand-700"
          >
            {s.name}
          </a>
        ))}
      </div>
    </div>
  )}

  {nearbyAreas.length > 0 && (
    <div>
      <h3 class="text-sm font-semibold uppercase tracking-wide text-stone-400">
        {service ? `${service.name} in nearby areas` : 'Nearby service areas'}
      </h3>
      <div class="mt-3 flex flex-wrap gap-2">
        {nearbyAreas.map((a) => (
          <a
            href={service ? comboUrl(a.slug, service.slug) : areaUrl(a.slug)}
            class="rounded-full border border-stone-200/60 bg-white px-3.5 py-1.5 text-xs font-medium text-stone-600 transition-all hover:border-brand-300 hover:bg-brand-50 hover:text-brand-700"
          >
            {a.name}
          </a>
        ))}
      </div>
    </div>
  )}
</nav>
```

---

## 9. Design System

### Typography

Every site uses two fonts loaded from Google Fonts:

- **Display font**: Used for headings (H1, H2, H3). A serif or distinctive font that conveys the brand personality.
- **Body font**: Used for paragraphs, labels, and UI text. A clean sans-serif for readability.

Good combinations by industry tone:

| Tone | Display Font | Body Font |
|------|-------------|-----------|
| Professional / Traditional | DM Serif Display | DM Sans |
| Modern / Clean | Inter | Inter |
| Friendly / Approachable | Nunito | Open Sans |
| Premium / Luxury | Playfair Display | Lato |
| Industrial / Strong | Oswald | Source Sans 3 |
| Medical / Clinical | Merriweather | Roboto |

### Phone CTA

The phone number must be visible at all times via a sticky header button:

```astro
<a
  href={business.phoneHref}
  class="inline-flex items-center gap-2 rounded-lg bg-brand-800 px-4 py-2 text-sm font-medium text-white shadow-sm transition-all hover:bg-brand-700 hover:shadow-md"
>
  <Icon name="lucide:phone" class="size-4" />
  <span class="hidden sm:inline">{business.phone}</span>
  <span class="sm:hidden">Call Now</span>
</a>
```

### Trust Signals

Every page must display trust signals. Choose 4 that apply to the business:

- Years of experience
- License/certification number
- BBB rating or industry accreditations
- 24/7 availability (if applicable)
- Number of completed jobs
- Satisfaction guarantee
- Insurance coverage
- Number of 5-star reviews

### Mobile Navigation

Use a hamburger menu with vanilla JS (no framework dependencies):

```astro
<button
  type="button"
  class="inline-flex size-10 items-center justify-center rounded-lg text-stone-500 transition-colors hover:bg-stone-100 hover:text-stone-700 lg:hidden"
  aria-label="Toggle menu"
  id="mobile-menu-btn"
>
  <Icon name="lucide:menu" class="size-5" id="menu-icon-open" />
  <Icon name="lucide:x" class="hidden size-5" id="menu-icon-close" />
</button>

<script>
  const btn = document.getElementById('mobile-menu-btn');
  const menu = document.getElementById('mobile-menu');
  const iconOpen = document.getElementById('menu-icon-open');
  const iconClose = document.getElementById('menu-icon-close');

  btn?.addEventListener('click', () => {
    menu?.classList.toggle('hidden');
    iconOpen?.classList.toggle('hidden');
    iconClose?.classList.toggle('hidden');
  });
</script>
```

### Card Hover

Card hover effects must be defined in `@layer components`, never in `@utility`:

```css
@layer components {
  .card-hover {
    transition: transform 0.3s ease, box-shadow 0.3s ease;
  }
  .card-hover:hover {
    transform: translateY(-4px);
    box-shadow: 0 12px 24px -8px rgba(0, 0, 0, 0.15);
  }
}
```

---

## 10. Color Psychology by Industry

Choose the brand palette based on what the industry needs to communicate. The palette is defined as `--color-brand-50` through `--color-brand-950` in `@theme`.

| Industry | Recommended Color Family | Hex Range (500 anchor) | Psychology |
|----------|------------------------|----------------------|------------|
| Plumbing | Blue | `#3b82f6` | Trust, water, reliability |
| HVAC | Teal / Cyan | `#06b6d4` | Cool air, technology, comfort |
| Electrician | Amber / Yellow | `#f59e0b` | Energy, power, safety, caution |
| Roofing | Slate / Gray-Blue | `#64748b` | Strength, protection, durability |
| Landscaping | Green | `#22c55e` | Nature, growth, freshness |
| Pest Control | Red-Orange | `#ef4444` | Urgency, action, elimination |
| Dentist | Sky Blue | `#0ea5e9` | Clean, clinical, calming |
| Veterinarian | Warm Green | `#16a34a` | Care, nature, health |
| Cleaning Services | Light Blue / Teal | `#06b6d4` | Clean, fresh, sparkling |
| Lawyer / Attorney | Navy / Dark Blue | `#1e3a5f` | Authority, trust, professionalism |
| Accountant | Dark Green / Teal | `#0d9488` | Money, stability, trust |
| Auto Repair | Red / Dark Red | `#dc2626` | Power, speed, mechanical |
| Locksmith | Dark Gray / Charcoal | `#374151` | Security, strength, reliability |
| Moving Company | Orange | `#f97316` | Energy, movement, warmth |
| Hair Salon | Pink / Mauve | `#ec4899` | Style, creativity, personal care |
| Photography | Neutral / Warm Gray | `#78716c` | Sophistication, focus, artistry |
| General Contractor | Brown / Amber | `#b45309` | Earth, building, solidity |
| Painting | Indigo / Purple | `#6366f1` | Creativity, transformation |
| Garage Door | Steel Blue | `#3b82f6` | Industrial, reliability |
| Tree Service | Deep Green | `#15803d` | Nature, strength, outdoors |
| Pressure Washing | Bright Blue | `#2563eb` | Water, clean, powerful |
| Handyman | Warm Orange | `#ea580c` | Handy, approachable, skilled |
| Spa / Wellness | Sage / Soft Green | `#86efac` | Calm, relaxation, wellness |
| Restaurant | Red / Warm | `#dc2626` | Appetite, warmth, energy |
| Gym / Fitness | Bold Red or Black | `#dc2626` | Power, motivation, intensity |

### Generating the Full Palette

Given a brand-500 anchor color, generate the full 50-950 scale. The pattern:

- **50**: Very light tint (nearly white with a hint of the color)
- **100-200**: Light tints for backgrounds and hover states
- **300-400**: Mid tints for borders and secondary elements
- **500**: The anchor/primary color
- **600-700**: Darker shades for text and primary buttons
- **800-900**: Very dark for headings and hero backgrounds
- **950**: Near-black with brand undertone

Use HSL manipulation: keep the hue constant, lower saturation slightly at extremes, and adjust lightness from ~97% (50) down to ~8% (950).

### Accent Color

Every site uses amber as the accent for CTAs and highlights. This is consistent across all industries:

```css
--color-amber-400: #fbbf24;
--color-amber-500: #f59e0b;
--color-amber-600: #d97706;
```

The amber accent creates visual contrast against any brand color and signals "call to action."

---

## 11. Data Architecture

### business.ts

The central business configuration file. Every field is required unless marked optional.

```typescript
export interface BusinessHours {
  days: string;
  hours: string;
}

export interface Address {
  street: string;
  city: string;
  state: string;
  zip: string;
}

export interface Coordinates {
  lat: number;
  lng: number;
}

export interface Business {
  name: string;
  legalName: string;
  owner: string;
  phone: string;
  phoneHref: string;          // tel:+1XXXXXXXXXX format
  email: string;
  website: string;            // Full URL with https://
  address: Address;
  coordinates: Coordinates;   // For schema.org GeoCoordinates
  hours: BusinessHours[];
  license: string;            // License number or certification
  yearEstablished: number;
  serviceRadius: string;      // Human-readable, e.g., "Travis and Williamson Counties"
  schemaType: string;         // From the Schema.org type mapping table
  description: string;        // 1-2 sentences, used in meta and schema
  tagline: string;            // Short tagline for the hero section
}

export const business: Business = {
  // Populated with actual business data during build
};

export function yearsInBusiness(): number {
  return new Date().getFullYear() - business.yearEstablished;
}
```

### serviceAreas.ts

Each service area represents a city, town, or neighborhood the business serves.

```typescript
export interface ServiceArea {
  slug: string;               // URL-safe, lowercase, hyphenated
  name: string;               // Display name (e.g., "Round Rock")
  county: string;             // County name (e.g., "Williamson County")
  population: number;         // For content generation context
  priority: 'primary' | 'secondary' | 'tertiary';
  lat: number;
  lng: number;
  nearby: string[];           // Slugs of nearby areas (for cross-linking)
  description: string;        // 2-3 sentences about the area and common service needs
  zipCodes: string[];         // For schema and local SEO
  responseTime: string;       // e.g., "30 minutes", "45-60 minutes"
}

export const serviceAreas: ServiceArea[] = [
  // 8-15 areas recommended
];

export function getAreaBySlug(slug: string): ServiceArea | undefined {
  return serviceAreas.find((area) => area.slug === slug);
}

export function getNearbyAreas(area: ServiceArea): ServiceArea[] {
  return area.nearby
    .map((slug) => getAreaBySlug(slug))
    .filter((a): a is ServiceArea => a !== undefined);
}

export function getAreaName(slug: string): string {
  const area = getAreaBySlug(slug);
  return area ? area.name : slug;
}
```

### serviceTypes.ts

Each service type represents a distinct service the business offers.

```typescript
export interface ProcessStep {
  title: string;
  description: string;
}

export interface PriceRange {
  min: number;
  max: number;
}

export interface ServiceType {
  slug: string;               // URL-safe, lowercase, hyphenated
  name: string;               // Display name (e.g., "Leak Repair")
  shortDescription: string;   // 1 sentence for cards
  description: string;        // 2-3 sentences for full pages
  priceRange: PriceRange;     // Typical price range in USD
  emergency: boolean;         // Whether this service is available 24/7
  icon: string;               // Lucide icon name (e.g., "lucide:droplets")
  image: string;              // Path to service image in /public/images/
  processSteps: ProcessStep[]; // 4 steps describing the service process
}

export const serviceTypes: ServiceType[] = [
  // 5-10 services recommended
];

export function getServiceBySlug(slug: string): ServiceType | undefined {
  return serviceTypes.find((service) => service.slug === slug);
}

export function getServiceName(slug: string): string {
  const service = getServiceBySlug(slug);
  return service ? service.name : slug;
}

export function getEmergencyServices(): ServiceType[] {
  return serviceTypes.filter((service) => service.emergency);
}
```

### seoContent.ts

Generates dynamic SEO content (FAQs, reviews) for each page.

```typescript
import type { ServiceArea } from './serviceAreas';
import type { ServiceType } from './serviceTypes';

export interface FaqItem {
  question: string;
  answer: string;
}

/**
 * Generate 5 FAQ items tailored to a service area and optional service type.
 * Every FAQ answer must include the business name and phone number at least once.
 */
export function generateFaqs(
  area: ServiceArea,
  service?: ServiceType,
): FaqItem[] {
  // Generate questions covering:
  // 1. Cost / pricing in the area
  // 2. Response time to the area
  // 3. Licensing and insurance
  // 4. Emergency availability
  // 5. Other areas served nearby
  // See the plumbing example in the templates for the exact pattern.
}

export interface Review {
  author: string;
  date: string;       // ISO date string
  rating: number;     // 1-5
  text: string;
  area?: string;      // Area slug for relevance matching
  service?: string;   // Service slug for relevance matching
}

// PLACEHOLDER: Replace with real customer reviews.
export const reviews: Review[] = [];

/**
 * Return up to `count` reviews prioritizing area and service matches.
 */
export function getReviewsForPage(
  areaSlug?: string,
  serviceSlug?: string,
  count: number = 3,
): Review[] {
  // Score: +2 for area match, +2 for service match
  // Sort by score descending, return top `count`
}
```

---

## 12. Page Templates

### Combination Page Structure (the "Money Page")

This is the most important page type. Each one targets a "[service] in [area]" keyword.

Sections in order:

1. **Breadcrumbs** (Home > Services > [Area] > [Service])
2. **Hero / H1** with service icon, heading, description, and service image
3. **Emergency alert banner** (conditional, only if `service.emergency === true`)
4. **Description section** with area-specific content
5. **Price range section** with transparent pricing
6. **Process steps** (4-step visual grid)
7. **Why choose us** (4 trust signal cards)
8. **CTA section** with phone and contact buttons
9. **Related links** (other services in this area + same service in nearby areas)
10. **Service areas cross-links**
11. **Testimonials** (relevance-matched)
12. **FAQ accordion** with FAQPage schema

### getStaticPaths for Combination Pages

```typescript
export function getStaticPaths() {
  const paths = [];
  for (const area of serviceAreas) {
    for (const service of serviceTypes) {
      paths.push({
        params: { area: area.slug, service: service.slug },
        props: { area, service },
      });
    }
  }
  return paths;
}
```

### Homepage Structure

1. **Hero** with gradient background, H1, tagline, and CTA buttons
2. **Stats bar** (4 trust signals in a grid)
3. **Services grid** (cards linking to individual service pages)
4. **How we work** (interactive 4-step section with tabs)
5. **Reviews strip** (horizontal scroll of review cards)
6. **Areas section** (grid of area cards)
7. **CTA banner** (full-width call to action)

---

## 13. Content Guidelines

### Per-Page Word Count Targets

| Page Type | Minimum Words | Notes |
|-----------|--------------|-------|
| Homepage | 500 | Mostly in hero, services, and process sections |
| Combination page | 800 | Description + FAQ answers add up |
| Service page | 600 | Service description + process + FAQ |
| Area page | 500 | Area description + services list + FAQ |
| About page | 400 | Owner bio, credentials, company history |
| Contact page | 200 | Form + business hours + map embed |
| Blog post | 800-1500 | Long-form educational content |

### Content Tone by Industry

Adjust the tone while keeping the 8th-grade reading level requirement:

| Industry | Tone | Example Phrase |
|----------|------|---------------|
| Plumbing / HVAC / Electrical | Reliable, straightforward | "We fix it right the first time." |
| Medical / Dental | Caring, professional | "Your comfort and health are our priority." |
| Legal / Financial | Authoritative, reassuring | "Protecting your rights with experienced counsel." |
| Beauty / Spa | Welcoming, personal | "Your perfect look starts here." |
| Fitness | Motivating, energetic | "Push your limits. We are here to help." |
| Cleaning / Pest Control | Clean, efficient | "A cleaner home is just a call away." |
| Landscaping / Tree | Natural, expert | "Bringing your outdoor vision to life." |
| Auto / Mechanical | Tough, dependable | "Honest work at a fair price." |

### FAQ Content Rules

- Every FAQ section has exactly 5 questions
- Questions must include the area name and service name
- Answers are 2-3 sentences long
- At least 2 answers must include the business phone number
- At least 2 answers must include the business name
- At least 1 answer must mention the license/certification

---

## 14. Image Strategy

### Required Images

| Image | Path | Size | Purpose |
|-------|------|------|---------|
| Hero | `/images/hero.webp` | 2048x2048 | Homepage hero background |
| Per service | `/images/[service-slug].webp` | 1024x1024 | Service cards and headers |
| OG default | `/og-default.webp` | 1200x630 | Social sharing fallback |
| Favicon | `/favicon.svg` + `/favicon.ico` | - | Browser tab icon |

### Image Format

- All images in WebP format for optimal compression
- Hero images: `loading="eager"` (above the fold)
- All other images: `loading="lazy"`
- Always include `width` and `height` attributes to prevent layout shift
- Alt text must be descriptive and include the service name and area name where relevant

### AI Image Generation (Optional)

If a Gemini API key is available, the agent can generate service images using:

```bash
python3 ~/.claude/skills/nano-banana-pro/scripts/generate_image.py \
  --prompt "Professional [service] work in a [area] home, photo-realistic, bright lighting" \
  --output public/images/[service-slug].webp
```

If no AI image generation is available, use placeholder images and add a comment noting they should be replaced.

---

## 15. Deployment

### Cloudflare Pages (Recommended)

1. Push the repository to GitHub
2. Connect to Cloudflare Pages
3. Build command: `npm run build`
4. Output directory: `dist`
5. Environment variable: None required for static sites

### robots.txt

```
User-agent: *
Allow: /

Sitemap: https://BUSINESS_DOMAIN.com/sitemap-index.xml
```

### Build Verification

After building, verify:

```bash
npm run build
# Check page count
ls -la dist/ | wc -l
# Verify sitemap exists
cat dist/sitemap-index.xml
# Spot-check a combo page
cat dist/services/[area]/[service]/index.html | head -50
```

---

## 16. Build Checklist

Use this checklist before considering a site complete:

### Data Files
- [ ] `business.ts` populated with all real business data
- [ ] `serviceAreas.ts` has 8-15 areas with coordinates, nearby links, and descriptions
- [ ] `serviceTypes.ts` has 5-10 services with descriptions, prices, and 4 process steps each
- [ ] `seoContent.ts` FAQ generator produces 5 questions per area/service combo
- [ ] Schema type in `business.ts` matches the industry (see type mapping table)

### Pages
- [ ] Homepage builds and has WebSite + BusinessType + WebPage schema
- [ ] All combination pages generate (services x areas)
- [ ] All service pages generate
- [ ] All area pages generate
- [ ] About page with owner bio and credentials
- [ ] Contact page with form, hours, and phone number
- [ ] Blog index page and at least 1 sample blog post
- [ ] 404 page exists

### SEO
- [ ] Every page has a unique title tag under 60 characters
- [ ] Every page has a meta description of 140-155 characters
- [ ] Every page has exactly one H1
- [ ] Every page has canonical URL, OG tags, and Twitter card
- [ ] Every page has JSON-LD schema markup
- [ ] XML sitemap generates and includes all pages
- [ ] robots.txt exists with sitemap reference
- [ ] Internal linking mesh is complete (combo pages cross-link to related pages)

### Design
- [ ] Phone CTA visible in sticky header at all times
- [ ] Trust signals displayed on every page
- [ ] Mobile hamburger menu works (vanilla JS, no framework)
- [ ] Card hover effects defined in `@layer components` (not `@utility`)
- [ ] Two fonts loaded (display + body)
- [ ] Brand palette defined in `@theme` (50-950 scale)
- [ ] Amber accent used for CTA buttons
- [ ] All images have alt text, width, height, and appropriate loading attribute

### Technical
- [ ] `output: 'static'` in astro.config.mjs
- [ ] `trailingSlash: 'always'` in astro.config.mjs
- [ ] Tailwind v4 in `vite.plugins`, not integrations
- [ ] No `tailwind.config.js` file exists
- [ ] Content collection config at `src/content.config.ts`
- [ ] `npm run build` succeeds with zero errors
- [ ] Page count matches expected (services x areas + services + areas + static pages)
