# Памятка для юриста / DSB — DSGVO-проверка нового сайта dr-ehrlichmann.de

> **Для владельца (по-русски):** это документ для передачи **юристу или внешнему DSB** (Datenschutzbeauftragter).
> Здесь собрано: (1) что уже технически сделано на новом сайте, (2) что юрист должен проверить и подтвердить, (3) что зависит от его ответов.
> Юр-тексты (Impressum, Datenschutzerklärung) на сайте — **черновики**, написаны добросовестно, но **финальная ответственность за юристом**. Claude не юрист.
> Просто перешли юристу всё, что ниже двойной черты (немецкая часть).
>
> **Главное, что надо сделать тебе перед запуском (не юристу, а тебе):**
> 1. **VPS у Hostinger должен стоять в дата-центре ЕС** (Hostinger предлагает Литву / Нидерланды / Германию). Если сейчас локация вне ЕС — сменить. Текст Datenschutz утверждает «Server in der EU», это должно быть правдой.
> 2. **Заключить с Hostinger договор AVV / Data Processing Agreement** (Art. 28 DSGVO) — обычно доступен в панели Hostinger / по запросу в поддержку.
> 3. То же самое (AVV) — с почтовым/SMTP-провайдером, через который форма шлёт письма.

---

## Mandanteninformation — Datenschutz-Prüfung der neuen Praxis-Website

**Praxis:** Zahnarztpraxis Dr. Natalia Ehrlichmann, Zeithstraße 117, 53819 Neunkirchen-Seelscheid.
**Anlass:** Die bestehende WordPress-Website wird durch eine neue, technisch schlanke Website ersetzt (gleiche Domain `dr-ehrlichmann.de`, gleiche Seiten- und Bild-URLs, keine Weiterleitungen). Wir bitten um eine datenschutz- und berufsrechtliche Prüfung vor dem Livegang.

### 1. Technischer Ausgangszustand (bereits umgesetzt)

- **Statische Website** (vorgerenderte HTML-Seiten), gehostet auf einem **eigenen VPS bei Hostinger International Ltd** (Rechenzentrum innerhalb der EU vorgesehen).
- **Keine Cookies, kein Tracking, keine Analyse-Tools im Auslieferungszustand.** Beim Laden der Seiten werden **keinerlei Drittanbieter-Ressourcen** nachgeladen (Schriftarten/„Inter" lokal selbst gehostet, Lightbox/JavaScript lokal, keine CDNs, kein Google Fonts vom Google-Server).
- **Eingebettete Inhalte Dritter (YouTube, Vimeo, Google Maps)** werden über eine **2-Klick-/Consent-Lösung** geladen: Der Inhalt (iframe) wird **erst nach aktiver Zustimmung per Klick** geladen. Bis dahin besteht keine Verbindung zum Drittanbieter. Rechtsgrundlage der Einbettung nach Klick: **Art. 6 Abs. 1 lit. a DSGVO** (Einwilligung); die Auswahl wird lokal (localStorage) gespeichert und ist widerruflich.
- **Kontaktformulare** (Terminanfrage, Kontakt): Übermittlung per Server-Funktion an die Praxis-E-Mail; **Empfänger ausschließlich `praxis@dr-ehrlichmann.de`**, zusätzlich **automatische Eingangsbestätigung an die Patientin/den Patienten** und eine **interne Sicherungskopie** der Anfrage. Pflichtfelder, Honeypot gegen Spam, Einwilligungs-Checkbox.
- **Impressum** und **Datenschutzerklärung** sind vorhanden (Entwürfe), inkl. Abschnitten zu Hosting, eingebetteten Drittinhalten, Schriftarten, Betroffenenrechten sowie zur Verarbeitung von Gesundheitsdaten.

### 2. Bitte prüfen / bestätigen (Checkliste)

**A. Impressum (§ 5 DDG, § 18 Abs. 2 MStV, Berufsrecht)**
- [ ] Vollständigkeit der berufsrechtlichen Angaben: **Berufsbezeichnung** „Zahnärztin" (verliehen in der BRD), **zuständige Zahnärztekammer** und **Kassenzahnärztliche Vereinigung** (Nordrhein), **zuständige Aufsichtsbehörde**.
- [ ] Korrekte Angabe der **berufsrechtlichen Regelungen** (Heilberufsgesetz NRW, Berufsordnung der ZÄK Nordrhein, ZHG, GOZ) inkl. Zugänglichkeit.
- [ ] **Verantwortlicher i.S.d. § 18 Abs. 2 MStV** (V.i.S.d.P.) korrekt benannt.

**B. Datenschutzerklärung — Schwerpunkt Gesundheitsdaten (Art. 9 DSGVO)**
- [ ] **Verarbeitung besonderer Kategorien personenbezogener Daten (Gesundheitsdaten)** über die Formulare Terminanfrage/Kontakt: Ist die gewählte Rechtsgrundlage **Art. 9 Abs. 2 lit. h DSGVO i.V.m. § 22 BDSG und § 630a BGB** korrekt und ausreichend, oder ist **zusätzlich eine ausdrückliche Einwilligung nach Art. 9 Abs. 2 lit. a DSGVO** erforderlich?
- [ ] **Einwilligungstext / Checkbox-Formulierung** auf den Formularen: ausreichend bestimmt, freiwillig, transparent? Formulierungsvorschlag erbeten.
- [ ] **Speicherdauer / Löschkonzept** für Formulareingänge (E-Mail + interne Sicherungskopie) und Server-Logdaten.
- [ ] **Technische und organisatorische Maßnahmen (TOM)** für die Formularverarbeitung (verschlüsselte Übertragung TLS, Zugriffsbeschränkung auf die Sicherungskopie).

**C. Auftragsverarbeitung & Dienstleister (Art. 28 DSGVO, Verzeichnis von Verarbeitungstätigkeiten)**
- [ ] **Hosting: Hostinger International Ltd** (Sitz Zypern/EU). Bitte AVV/DPA prüfen; **Bestätigung, dass der genutzte Server in einem EU-Rechenzentrum** liegt.
- [ ] **E-Mail-/SMTP-Versand** der Formulare: Anbieter benennen, AVV prüfen, Versand DSGVO-konform (SPF/DKIM/DMARC technisch vorgesehen).
- [ ] Aufnahme aller Verarbeiter in das **Verzeichnis von Verarbeitungstätigkeiten**.

**D. Noch nicht aktive Bausteine — vor Aktivierung prüfen**
- [ ] **Google Analytics 4** (derzeit NICHT eingebunden): Bei Aktivierung erforderlich → **Cookie-/Consent-Banner mit vorheriger Einwilligung (§ 25 Abs. 1 TDDDG, Art. 6 Abs. 1 lit. a DSGVO)**, Script-Blockierung bis zur Einwilligung, AVV mit Google, Datenübermittlung in Drittländer (SCC), IP-Anonymisierung.
- [ ] **Zipchat (KI-Chat-Widget)** (derzeit NICHT aktiv eingebunden): Datenfluss zum Drittanbieter, Drittlandübermittlung, **Einwilligung + AVV + Drittlandgarantien** prüfen, bevor das Widget live geht.
- [ ] **Cookie-/Consent-Banner:** Wird **erst mit GA4/Zipchat erforderlich**. Im aktuellen Zustand (keine Cookies, kein Tracking) ist nach § 25 TDDDG **kein Banner erforderlich** — bitte bestätigen.

### 3. Hinweis zur aktuellen Banner-Situation

Im Auslieferungszustand setzt die Website **keine Cookies** und lädt **keine Tracking-/Drittanbieter-Skripte** beim Seitenaufruf. Nach unserer Einschätzung ist daher **derzeit kein Cookie-Consent-Banner nach § 25 TDDDG erforderlich**. Ein Banner würde erst notwendig, sobald einwilligungspflichtige Technologien (z. B. GA4, KI-Chat) aktiviert werden. **Bitte um Bestätigung oder Korrektur dieser Einschätzung.**

---

_Stand: 2026-06-26. Diese Aufstellung ist eine technische/organisatorische Orientierung zur Vorbereitung der anwaltlichen Prüfung und stellt keine Rechtsberatung dar._
