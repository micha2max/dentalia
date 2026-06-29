# Referenz: local-business-builder (НЕ drop-in, а образец для адаптации)

**Источник:** https://github.com/savvity/local-business-builder · лицензия **MIT** · скопировано 2026-06-20.
**Полный клон:** `C:\Users\TomTim\lbb-inspect` (агент + скилл + все шаблоны).

Это **референс-паттерны** для нашей сборки на Astro (`dr-ehrlichmann.de`, путь «без WordPress»).
**Не копировать как есть** — адаптировать под наши требования (ниже).

## Что здесь и зачем

| Файл | Для чего у нас |
|---|---|
| `src/components/SEO.astro` | meta + OG + Twitter + **JSON-LD** — основа SEO головы страницы |
| `src/components/SeoFaq.astro` | **FAQPage**-схема — прямо под GEO/AI-поиск (важно для нас) |
| `src/components/Breadcrumbs.astro` | **BreadcrumbList**-схема + хлебные крошки |
| `src/components/SeoTestimonials.astro` | **Review/AggregateRating**-схема — у нас 4,8 (31) Google |
| `src/components/SeoRelatedLinks.astro` | внутренняя перелинковка (под наши TOC/«похожие статьи») |
| `src/components/SeoServiceAreas.astro` | ⚠️ блок «районы» — у нас **одна** практика, скорее не нужен (паттерн) |
| `src/content.config.ts` | **content collections** — под наши 25 Ratgeber-статей (Markdown) |
| `src/layouts/BaseLayout.astro` | базовый layout (структура `<head>`/слотов) — как образец |
| `src/lib/urls.ts` | хелперы URL — ⚠️ см. предупреждение ниже |
| `src/data/*.ts.template` | data-driven архитектура (бизнес-данные, услуги → кормят схему) |
| `astro.config.mjs` | конфиг с `@astrojs/sitemap` — образец |
| `guide/local-business-guide.md` | SEO-гайд из скилла (методика) |

## ⚠️ Обязательные адаптации под наш проект

1. **URL — НЕ брать их схему.** `urls.ts` делает `/services/[area]/[service]/` **со слешем на конце**.
   У нас железно: **сохранить существующие URL 1:1, БЕЗ слеша**, зеркалировать `/wp-content/uploads/` для картинок, без редиректов. Переписать под нашу реальную карту URL.
2. **Tailwind — убрать.** Компоненты используют Tailwind v4 классы. У нас **свой кастомный CSS** (`design-mockup/style.css`, дизайн зафиксирован). При переносе — снять Tailwind-классы и перевести на наш CSS.
3. **Cloudflare — убрать.** В `astro.config.mjs` адаптер Cloudflare. Нам нужна **статика на Hetzner**: оставить `@astrojs/sitemap`, выкинуть `@astrojs/cloudflare`.
4. **Язык EN → DE.** `SITE_NAME`, `og:locale` (→ `de_DE`), весь текст — на немецкий.
5. **Схема под нас:** `Dentist` + `LocalBusiness`/`MedicalBusiness`, `FAQPage`, `Review`/`AggregateRating`, `BreadcrumbList`. NAP: Zeithstraße 117, 53819 Neunkirchen-Seelscheid, Tel. 02247 7171, praxis@dr-ehrlichmann.de.
6. **`business.ts`** заполнить реальными данными практики; `serviceTypes.ts` — нашими услугами.
7. **services × areas** (программные страницы) **НЕ генерировать** — одна практика, риск «тонкого» контента. Только как паттерн на будущее (соседние города), с осторожностью.

## Сознательно НЕ скопировано
`Header.astro` / `Footer.astro` (у нас свой дизайн), `pages/*` (конфликт со схемой URL), `global.css` (Tailwind), `package.json`/`tsconfig.json` (у нас свои). Всё это есть в полном клоне `lbb-inspect`, если понадобится подсмотреть.
