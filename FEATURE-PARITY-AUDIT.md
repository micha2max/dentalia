# Feature-Parity-Audit — dr-ehrlichmann.de (Original WordPress → Neu Astro)

**Datum:** 2026-06-24 · **Ziel:** systematisch erfassen, welche Blöcke/Funktionen/„Plugin-Fishки" das Original hat und wie gut unser neuer Astro-Build sie abdeckt. **Design bleibt MedSpace** (vom Inhaber bestätigt) — es geht um Funktionalität & Reichhaltigkeit, nicht um Pixel-Kopie der WP-Theme.

**Stack des Originals** (DataForSEO + Migrationsanalyse): WordPress · **SiteOrigin Page Builder** (alle Grid-/Karten-/Icon-Blöcke) · Redux Framework (Dentalia-Theme) · Google Analytics + GTM · iubenda · MySQL/Apache/PHP. Zusätzliche Plugins (aus Migration rekonstruiert): wpremark (Callouts), Expert Review, Inline Related Posts, Quizle, fbd-forum-list, aod-cta, TablePress, Audio-Player, RPI-Review-Widget (Google/FB), Contact Form 7.

**Легенда:** ✅ есть (равноценно или лучше) · ⚠️ частично · ❌ нет · 🔧 есть, но надо подчистить миграционный мусор.

---

## 1. Глобально (шапка/подвал/навигация)
| Фича оригинала | Статус | Где у нас / заметка |
|---|---|---|
| Топбар: телефон · адрес · часы · Notdienst | ✅ | топбар (Notdienst 01805 986700) |
| Меню (вкл. Startseite) | ✅ | nav в `site.ts` |
| Поиск по сайту | ✅ | `/ratgeber?q=` clientside + WebMCP `search_site` |
| Подвал: Schnellzugriff + Sprechstunden | ✅ | footer в `BaseLayout` |
| Mobile-bottom-bar (Anruf/Termin) | ✅ | есть |
| iubenda (cookie/consent) | ✅ лучше | заменён на self-hosted `ConsentEmbed` (2-Klick), 0 внешних вызовов |

## 2. Startseite
| Фича оригинала | Статус | Заметка |
|---|---|---|
| Hero (семейное фото + hex-паттерн) | ✅ (наш вариант) | MedSpace-hero; hex-паттерн намеренно не копируем |
| Ряд иконок-фич | ✅ | symptom-grid + why-grid (у нас богаче) |
| Блок «Zahnarzt Neunkirchen-Seelscheid» + медаль-бейдж | ✅ | about+timeline секция |
| **Отзывы из НЕСКОЛЬКИХ источников** (Google/jameda/…колонки) | ⚠️ | у нас 3 Google-отзыва. Оригинал показывал мульти-источник. Решить: расширять? |
| Сетка услуг (иконки) | ✅ | services-grid + Schwerpunkte |
| FAQ | ✅ лучше | аккордеон + FAQPage-schema |
| «Aktuelle Artikel» (тизер блога) | ✅ | blog-teaser |
| — (нет в оригинале) Викторина «Wie gesund sind Ihre Zähne» | ✅➕ | у нас ЕСТЬ, в оригинале на главной нет |

## 3. Leistungen (страницы услуг)
| Фича оригинала | Статус | Заметка |
|---|---|---|
| Хабы: сетка карточек услуг | ✅ | children-grid |
| Конечная услуга: контент + сайдбар | ✅ | 2-колонка, светлый Termin-бокс, Kontakt&Anfahrt, часы, миниатюры |
| Блок «Weitere Leistungen» (родственные) | ✅ 🔧→✅ | был сырой дамп → теперь карточная сетка (плагин `remark-leistung-related`) |
| Кикеры/подзаголовки | ✅ | ALL-CAPS → eyebrow |

## 4. Ratgeber-Artikel — самое важное
| Фича оригинала | Статус | Заметка |
|---|---|---|
| Byline (Verfasst von · Lesedauer) | ✅ | есть |
| Expert-Review-блок (фото врача + ответ) | ✅ | `.expert-qa` |
| Плюсы/минусы «Das Wichtigste in Kürze» | ✅ | `.expert-qa--takeaways` |
| FAQ-аккордеон в статье | ✅ | `<details class="qa">` |
| Callout-блоки (wpremark, 5 тонов) | ✅ | `.callout` |
| Inline «Lesetipp» (контекстные ссылки) | ✅ | `remark-lesetipp` |
| Нижний блок «Das könnte Sie auch interessieren» | ✅ | related-cards |
| Комментарии (48 перенесены) + форма | ✅ | модерация; отправка — функция на деплое |
| Видео (YouTube/Vimeo) с согласием | ✅ | `remark-consent-embeds` |
| Викторины (Quizle) | ✅ | 4 викторины |
| Таблицы (TablePress) | ✅ | `.data-table` |
| Аудио/подкаст | ✅ | нативный `<audio>` |
| Рейтинг-бейдж (RPI Google/FB) | ✅ | `.rating-badge` (статичный, без внешних аватарок) |
| Боксы эксперта во ВСЕХ статьях | ✅ | сегодня: +12 статей (`remark-expert-note`) |
| **Кнопки «Teilen» (Facebook/LinkedIn/Twitter)** | ❌ | в оригинале есть, у нас нет |
| **Навигация «vorheriger/nächster Beitrag»** | ❌ | в оригинале есть, у нас нет |
| **Schlagwörter (теги) + архив `/schlagwort/…`** | ❌ | у нас Themen/рубрики; тегов нет |

## 5. Praxis-Seiten
| Фича оригинала | Статус | Заметка |
|---|---|---|
| `/zahnarztpraxis` (галерея, история, философия) | ✅ лучше | фото-**слайдер** + lightbox |
| `/praxisteam` | ✅ | сетка (van Giersbergen убран) |
| `/praxisphilosophie` | ✅ 🔧→✅ | был дамп → сегодня почищен (карточки + кикер + pullquote) |
| `/ausbildung-zur-zfa`, `/stellenangebot` | ✅ | есть |

## 6. Fragen / Lexikon / Umfragen
| Фича оригинала | Статус | Заметка |
|---|---|---|
| `/fragen` (FAQ) | ✅ | + виджет «Meistdiskutierte Themen» (fbd-forum-list) |
| `/zahnmedizin-lexikon` (A-Z) | ✅ | A-Z навигация с якорями |
| `/umfragen-vergleiche` | ✅ | пересобран как чистый рейтинг |

## 7. Формы / Аналитика / Согласие
| Фича оригинала | Статус | Заметка |
|---|---|---|
| Contact Form 7 (Termin/Kontakt) | ⚠️ | разметка есть; backend (функция+SMTP) — на деплое |
| Google Analytics + GTM | ❌ | намеренно нет (привязано к cookie-баннеру; включаем на деплое) |
| iubenda | ✅ лучше | self-hosted consent-gate |
| Anfahrt-карта (Google Maps) | ✅ | `/kontakt`, 2-Klick consent |

## 8. SEO / Extras (где мы СИЛЬНО впереди оригинала)
| Фича | Статус |
|---|---|
| Schema: Dentist · WebSite · FAQPage · BlogPosting · Breadcrumb | ✅➕ |
| `llms.txt` (динамический) + WebMCP-инструменты | ✅➕ (у оригинала нет) |
| 0 внешних сетевых вызовов (приватность/PSI) | ✅➕ |
| Self-hosted Inter, self-hosted consent, self-hosted CMS-бандл | ✅➕ |
| Lighthouse A11y/BP/SEO 100 | ✅➕ |

---

## Итог: реальные пробелы (а не «не скопировали»)
**Почти всё уже есть или лучше.** Открытые пункты, которые стоит решить:

1. ❌ **Кнопки «Teilen»** на статьях (FB/LinkedIn/X/WhatsApp/E-Mail) — дёшево, полезно для распространения. _Малый объём._
2. ❌ **«vorheriger / nächster Beitrag»** под статьёй — улучшает навигацию/время на сайте. _Малый объём._
3. ❌ **Schlagwörter (теги)** + страницы-архивы `/schlagwort/<tag>` — у нас есть Themen, теги были отдельно. _Средний объём (новый тип страниц + URL 1:1)._
4. ⚠️ **Отзывы на главной — мульти-источник** (Google + jameda + …) vs наши 3 Google. _Малый-средний; нужны реальные данные/решение._
5. 🔧 **Сквозная зачистка миграционных дампов** на ОСТАЛЬНЫХ страницах (вдруг ещё где-то остался сырой блок, как был на praxisphilosophie). _Малый объём — прогон + точечные правки._
6. ⚠️ **Формы backend** + **GA/GTM + cookie-баннер** — это и так в плане деплоя.

## Рекомендованный порядок (если возьмёмся)
**Быстрые победы пакетом:** (1) Teilen-кнопки + (2) prev/next + (5) зачистка дампов — один заход, всё мелкое и заметное.
**Потом по желанию:** (3) теги, (4) мульти-отзывы.
**На деплой:** формы, GA/GTM, cookie-баннер.
