# Pre-Launch QA-Audit — dr-ehrlichmann.de

**Datum:** 2026-06-24 · **Methode:** Multi-Agent-Workflow (8 Prüf-Dimensionen parallel, jeder Befund adversarial verifiziert) → 42 Roh-Befunde → **41 bestätigt, 1 widerlegt**. Anschließend behoben + Build neu verifiziert.

**Stand nach Behebung:** Build grün (64 Seiten) · **0 kaputte interne Links** (65 Seiten geprüft) · **keine Heading-Order-Sprünge** · öffentliche Seite **0 externe Netzwerkaufrufe**.

---

## Behoben (38 Befunde + 4 zusätzlich vom Link-Checker gefunden)

### Kritisch
- **Interne Routing-Fehler (~50+ 404):** In-Content-Links ohne `/ratgeber/`-Präfix (`/zahnpflege` statt `/ratgeber/zahnpflege`), dazu `/praxis`, `/datenschutz/`, Tot-Slugs (`/die-perfekte-zahnpflege`, `/zahnreinigung`, `/notdienstsuche`, `/thema/ernaehrung-und-zaehne`, `/zahn-checkliste`) und 4 Trailing-Slash-Links. **Zentral gelöst** über neues Build-Plugin `src/lib/remark-fix-links.mjs` (Content-Dateien bleiben unangetastet → re-migrations-sicher, wie `remark-lesetipp`). Neuer Build-Guard `scripts/check-links.mjs` lässt den Build künftig bei toten internen Links auffallen.
- **Sveltia-CMS lud von `unpkg.com`** (`/admin`) — der einzige echte Bruch der „0-extern"-Regel beim Seitenaufruf. **Bundle self-hosted** (`public/admin/sveltia-cms.js`, gepinnt auf `@sveltia/cms@0.167.3`); `/admin` lädt jetzt lokal.

### Hoch
- **12 unsichtbare Bilder** im Karies-Artikel (Markdown `[]` statt `![]`) → vom Plugin als `<img>` wiederhergestellt (8 → 20 Bilder).
- **2 kaputte `<img>`** (2016/10-Pfad existiert nicht) → auf reale 2019/01-Assets umgebogen.
- **Lexikon-A-Z-Navigation (20 tote Anker):** Buchstaben-Trenner erhalten `id="letter_X"`.
- **3 fehlerhafte `tel:`-Links** (ohne +49) → kanonisches `tel:+49…`.
- **Impressum:** fehlende **Berufsbezeichnung „Zahnärztin"** und **Verantwortlicher nach § 18 Abs. 2 MStV** ergänzt (Pflichtangabe bei redaktionellem Ratgeber-Content).
- **Suche `/ratgeber?q=`** war funktionslos (SearchAction + WebMCP-Formular zeigten auf einen Endpunkt, der `q` ignorierte) → clientseitiger Filter ergänzt, ohne externen Aufruf.

### Mittel
- Heading-Order-Sprünge behoben auf Leistungen-, Thema-, Praxisteam-, Kinderzahnmedizin-, Implantate-, Praxisphilosophie- und Zahnaufhellung-Seiten (h3/h4/h5 → korrekte Ebene).
- 4 leere `<a></a>` auf Praxisphilosophie → in klickbare Überschriften umgewandelt.
- Impressum: tote Tab-Anker entfernt.
- `llms.txt`: Agent-Tools (`search_site`, `get_appointment_info`) werden jetzt gelistet.
- Breadcrumb-Home-URL (Trailing-Slash) in Catch-all-Route vereinheitlicht.
- **Datenschutz: Hosting-Abschnitt (Hetzner, AVV Art. 28)** ergänzt.

### Niedrig
- Tote Count-up-JavaScript-Reste entfernt; `twitter:title/description/image` ergänzt; Home-Canonical ohne Trailing-Slash; Quiz-Ergebnisseiten auf `noindex` + aus Sitemap/Suchindex entfernt; Tippfehler „Testergebins" → „Testergebnis" in Titeln; JSON-LD `Dentist` per `@id` konsolidiert + Publisher-`logo` + internationale `telephone`; `aria-label` für TOC- und Service-Sidebar-Navigation; Impressum `http://www` → kanonisch; Datenschutz „Zeithst." → „Zeithstraße", Telefon-Format vereinheitlicht; tote WP-Umfrage (`/umfragen-vergleiche`) als saubere Rangliste neu aufgebaut.
- Zusätzlich opportunistisch: **9 abgeschnittene Meta-Descriptions** der wichtigsten Seiten (Impressum, Datenschutz, Praxisphilosophie, Kinderzahnmedizin, Implantate, Zahnaufhellung, 3× Quiz-Ergebnis) neu getextet.

---

## Offen / bewusst zurückgestellt

- **~19 weitere zu lange Meta-Descriptions** (übrige Ratgeber-Artikel + einzelne Seiten): Roh-Textauszüge, mitten im Satz abgeschnitten (>165 Zeichen). Kein Fehler, aber SERP-Qualität. **Empfehlung:** in Praxis-Stimme nachtexten (Skill `zahnarzt-artikel-ehrlichmann` / `humanizer-de`) — eigener Folge-Task.
- **Sveltia-Bundle: interne Laufzeit-Referenzen auf `unpkg.com`** (lädt PrismJS lazy + Versions-Check) feuern nur, wenn die Inhaberin im `/admin`-Editor arbeitet — Admin ist `noindex`, nur für die Inhaberin und spricht ohnehin mit der GitHub-API. **Öffentliche Seite + Admin-Seitenaufruf sind extern-frei.** Akzeptiert.
- **glightbox-Vendor-CSS `font-family:arial`** (Lightbox-Bildunterschriften): toter Code, da keine Captions gesetzt werden. Akzeptierte Vendor-Ausnahme. (Latente `cdn.plyr.io`-Referenz zusätzlich per `plyr:{css:'',js:''}` neutralisiert.)
- **Widerlegt (kein Fehler):** Formular-Endpunkte `/api/kommentar`, `/api/kontakt`, `/api/terminanfrage` sind Laufzeit-POST-Ziele der Server-Funktion, keine statischen Dateien.

## Nicht Teil dieses Audits (Inhaber / Jurist / Deploy)
- Finale juristische Prüfung Impressum + Datenschutz durch DSB/Anwalt (besonders Art. 9 Gesundheitsdaten in den Formularen).
- GitHub-Account → Sveltia-Backend; Hetzner-VPS + nginx (kein Slash, Permissions-Policy, TLS, gzip/brotli); Formular-Funktion + SMTP/SPF/DKIM/DMARC; Zipchat-Snippet.
- Realer PSI/Lighthouse-Messlauf **nach** dem Deploy (localhost unterschätzt Performance).

---

## Neue Dateien aus diesem Audit
- `src/lib/remark-fix-links.mjs` — Build-Plugin, normalisiert migrierte interne Links (Präfix, Slug-Remaps, kaputte Bilder, Trailing-Slash).
- `scripts/check-links.mjs` — Build-Guard gegen tote interne Links (`node scripts/check-links.mjs` nach `astro build`).
