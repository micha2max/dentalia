# Bild-Layout-Audit: Galerien in Ratgeber-Artikeln (live vs. unser Rebuild)

> **✅ UMGESETZT 2026-06-29** — alle 6 Galerien gebaut (neue CSS-Varianten `.gallery--pair` + `.gallery--grid2` + Overlay-Caption `.g-cap` in `global.css`; direkter Content-md-Edit; Lightbox unverändert). Build grün (78 Seiten), 0 kaputte Links, 0 externe Aufrufe, Playwright desktop+mobile geprüft. Dieses Dokument ist ab hier nur noch Referenz.

**Stand: 2026-06-28.** Ziel (Wunsch des Inhabers): Bilder in den Artikeln sollen genauso angeordnet sein wie auf dem Live-Original `dr-ehrlichmann.de` — vor allem die **Galerien** (mehrere Bilder nebeneinander), nicht als gestapelte Einzelbilder.

Methode: 7 parallele Read-only-Agenten haben für **alle 25 Ratgeber-Artikel** das Live-Original-HTML (firecrawl rawHtml) mit unserem Content-`.md` verglichen. Keine Datei wurde verändert (nur Audit).

## Wichtigste Erkenntnis über das Original
- Das Original nutzt **KEINE** WP-`[gallery]`-Shortcodes / `wp-block-gallery` / `tiled-gallery` im Artikel-Body (außer `karies-behandeln`).
- Mehrbild-Gruppen sind als **SiteOrigin-Page-Builder-Zeilen** gebaut: zwei (oder vier) separate „Orion-Image"-Widgets in einer Grid-Zeile → rendern **nebeneinander** (2-spaltig auf Desktop, gestapelt auf Mobil).
- `karies-behandeln` ist der Sonderfall: dort sind es echte geflossene `[gallery]` → bei uns schon als Mosaik („1 groß + kleine") umgesetzt via `remark-galleries.mjs` (✅ bereits fertig).
- In **unserem** Content liegen diese Bilder als einzelne `<figure class="align-center">`-HTML-Blöcke → rendern **gestapelt** (untereinander). Genau das ist der Unterschied.

## ✅ Artikel, die schon PASSEN (keine Aktion nötig) — 19 von 25
- `karies-behandeln` (Mosaik-Galerien schon fertig)
- `mundgeruch`, `zahnschmerzen-am-wochenende`, `freiliegende-zahnhaelse-behandeln`, `zahnfleischentzuendung-was-hilft`, `zahnarztangst-verstehen-und-endlich-besiegen`, `zahnwechsel`, `zahnarzt-check-vor-der-reise`, `mit-biss-ins-alter` — Original hat nur Einzelbilder, unser Rebuild bildet sie 1:1 als gestapelte Einzelbilder ab.
- 8 bildlose Artikel (`zahnpflege`, `zahntipp`, `notdienst`, `finanzierung`, `muss-ich-zum-zahnarzt`, `lebenslauf-der-zaehne`, `wie-oft-gehen-sie-zum-zahnarzt`, `anamnesebogen-unnoetiger-papierkrieg`) — Original hat 0 Body-Bilder → MATCH.

## 🔧 Artikel, die GEÄNDERT werden müssen — 6
Im Original eine **nebeneinander-Galerie**, bei uns gestapelte Einzelbilder. **Zeilennummern vor dem Edit erneut prüfen** (jeder Galerie-Edit verschiebt nachfolgende Zeilen!).

### 1. `kreidezaehne-erkennen-und-behandeln.md` — **4er-Galerie (2×2) mit Tile-Captions** (Sonderfall)
- Zeilen **40, 44, 48, 52** = 4 Bilder, im Original ein **2-spaltiges 2×2-Raster** („Bilder von Kreidezähnen") mit Overlay-Caption je Kachel:
  - `mih_zahnarzt_neunkirchen-seelscheid-750x500.jpg` → „Kreidezähne Milchgebiss"
  - `kreidezaehne_zahnarzt_neunkirchen-seelscheid-750x500.jpg` → „Kreidezähne beim Kind"
  - `kreidezaehne-milchgebiss--750x500.jpg` → „Milchzähne können Kreidezähne sein"
  - `kreidezaehne-kinder-750x500.jpg` → „Kreidezähne müssen behandelt werden"
- **Standalone-Überschriften auf Zeilen 42, 46, 50, 54 ENTFERNEN** — das waren in Wahrheit die Tile-Captions (im Original Overlay-Text, kein H3/H4).
- **5. Bild** `kreidezahne-mih-muster.webp` (Zeile **56**) bleibt **Einzelbild** direkt unter der Galerie + seine kursive Caption (Zeile **58**) — so wie im Original.
- Alle übrigen Bilder im Artikel passen schon.

### 2. `die-optimale-prothesenreinigung.md` — 2er-Paar
- Zeilen **80–82** → 2-spaltiges Paar: `zahnersatz-pflege-750x500.jpg` + `zahnprothese-pflege-750x500.jpg`. Keine Captions. (Z. 44 + 114 bleiben Einzelbilder.)

### 3. `kinder-und-suessigkeiten.md` — 2er-Paar
- Zeilen **52–54** → 2-spaltiges Paar: `kinderbehandlung_neunkirchen-seelscheid-750x500.jpg` + `kinderbehandlung_seelscheid.jpg`. Keine Captions.

### 4. `zahngesundheit-in-der-pubertaet.md` — 2er-Paar
- Zeilen **87–89** → 2-spaltiges Paar: `zaehne-und-pubertaet-750x500.jpg` + `zahngesundheit_test-750x500.jpg`. Keine Captions. (Z. 31 + 99 = Infografiken, bleiben Einzelbilder.)

### 5. `zahnschmerzen-nach-einer-fuellung.md` — 2er-Paar mit Captions
- Zeilen **106–112** → 2-spaltiges Paar **mit Caption je Bild**: `zahnentzuendung_nach_der_fuellung-750x500.jpg` („Zahnentzündung") + `zahnnerv_entzuendung-750x500.jpg` („Zahnnerventzündung"). Die `#### …`-Captions (Z. 108, 112) als Bild-Untertitel übernehmen.

### 6. `richtige-zahnpflege-tipps-und-mundhygiene.md` — 2er-Paar
- Zeilen **112–114** → 2-spaltiges Paar: `zahngesundheit-750x500.jpg` + `fuellung_feature.jpg`. Keine Captions.
- (Optional/niedrig: Z. 237 + 253 sind im Original gerundete `orion_square`-Bilder neben dem Text — Styling-Detail, niedrige Prio, kann übersprungen werden.)

## 📐 Offene Design-/Umsetzungsfrage (morgen entscheiden)
Unsere bestehende `.gallery`-CSS (in `global.css`, gespeist von `remark-galleries.mjs`) ist ein **Mosaik „1 großes Lead + kleine Kacheln"** (Grid 2fr/1fr) — passt für die 4-Bild-Mosaike von `karies-behandeln`. Die 6 hier sind aber überwiegend **gleichwertige 2er-Paare** (50/50 nebeneinander) und einmal ein **2×2-Raster mit Captions** (kreidezaehne). Brauchen also wahrscheinlich eine **neue Galerie-Variante**:
- `.gallery--pair` = 2 gleich große Spalten, mobil gestapelt.
- `.gallery--grid2` (für kreidezaehne) = 2×2 gleich groß, mit Overlay-/Unter-Caption je Kachel.

**Umsetzungsweg (Vorschlag, morgen bestätigen):** Da es nur 6 Artikel sind und der Content-`.md`-Direkt-Edit hier projektüblich ist (wie Meta-Descriptions / expert-qa), die betroffenen `<figure>`-Blöcke direkt durch **einen** `<figure class="gallery gallery--pair">…</figure>` bzw. `gallery--grid2`-Block ersetzen. Alternative: `remark-galleries.mjs` so erweitern, dass es **aufeinanderfolgende `<figure>`-HTML-Blöcke** zu Galerien gruppiert (re-migration-safe, aber komplexer — Raw-HTML-Knoten im mdast parsen). Entscheidung morgen.

**WICHTIG:** Lightbox (`GLightbox`, `data-gallery="article"`) muss erhalten bleiben — jede Galerie-Kachel als `<a href=fullsize><img></a>`. Nach Änderung: `.astro`+`node_modules/.astro` leeren, `npm run build`, `node scripts/check-links.mjs`, Playwright desktop+mobile prüfen. Invariante: 0 externe Aufrufe.
