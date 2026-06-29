# Deploy-Anleitung — dr-ehrlichmann.de (Hostinger VPS)

> **RU — коротко для владельца.** Это пошаговая инструкция, как запустить сайт на
> твоём **Hostinger VPS**. Часть шагов — команды в терминале сервера (SSH); их
> можно скопировать как есть. После настройки **тебе сервер трогать не нужно**:
> правки контента ты делаешь в админке (`/admin`, Sveltia), а мои правки кода
> уезжают на сайт автоматически через GitHub. Места, где нужно вставить **свои
> данные**, помечены `__ВОТ_ТАК__`.

**Architektur:** statischer Astro-Build (nginx) + kleiner Node-Dienst für die
Formulare. Inhalte liegen in GitHub (Sveltia CMS), Bilder/URLs 1:1, 0 externe
Aufrufe, Ziel PSI 100.

---

## 0. Voraussetzungen / что нужно собрать заранее

- [ ] **Hostinger VPS** in einem **EU-Rechenzentrum** (Litauen/Niederlande/Deutschland) — wegen Gesundheitsdaten (Art. 9 DSGVO). Ubuntu 22.04/24.04.
- [ ] **SSH-Zugang** zum VPS (IP-Adresse + root- oder sudo-Benutzer).
- [ ] **DNS-Verwaltung** der Domain `dr-ehrlichmann.de` (bei Hostinger oder beim Domain-Anbieter).
- [ ] **E-Mail-Postfach** `praxis@dr-ehrlichmann.de` inkl. **SMTP-Zugangsdaten** (für den Formularversand).
- [ ] **GitHub-Account** (vorhanden ✓) + ein **Repository** mit diesem Projekt.
- [ ] **AVV/DPA** mit Hostinger (E-Mail-Hosting + VPS) unterzeichnet — Art. 28 DSGVO.

---

## 1. DNS vorbereiten

Im DNS der Domain setzen:

| Typ | Name | Wert |
|-----|------|------|
| A | `@` | `__VPS_IP__` |
| A | `www` | `__VPS_IP__` |
| (AAAA | `@` / `www` | `__VPS_IPv6__` — falls vorhanden) |

E-Mail-Zustellbarkeit (SPF/DKIM/DMARC) → siehe **`DNS-EMAIL.md`** in diesem Ordner.

> Tipp: Erst die A-Records setzen und ~1 h warten, bevor du das TLS-Zertifikat
> holst (Schritt 5).

---

## 2. VPS-Grundinstallation (einmalig)

Per SSH einloggen, dann:

```bash
sudo apt update && sudo apt -y upgrade
# nginx + certbot (TLS) + rsync
sudo apt -y install nginx python3-certbot-nginx rsync git
# Node 20 (NodeSource)
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt -y install nodejs
node -v   # sollte v20.x zeigen

# Webroot + ACME-Verzeichnis anlegen
sudo mkdir -p /var/www/dr-ehrlichmann.de /var/www/certbot
# Deploy-Benutzer (für GitHub-Auto-Deploy) — Webroot ihm übereignen
sudo adduser --disabled-password --gecos "" deploy
sudo chown -R deploy:deploy /var/www/dr-ehrlichmann.de
```

---

## 3. Projekt auf den Server holen + ersten Build

```bash
sudo git clone __GITHUB_REPO_URL__ /opt/dentalia-site
sudo chown -R deploy:deploy /opt/dentalia-site
cd /opt/dentalia-site
sudo -u deploy npm ci
sudo -u deploy npm run build
sudo -u deploy node scripts/check-links.mjs   # 0 broken links erwartet
# Build veröffentlichen
sudo -u deploy rsync -a --delete dist/ /var/www/dr-ehrlichmann.de/
```

---

## 4. nginx konfigurieren

```bash
sudo cp /opt/dentalia-site/deploy/nginx/dr-ehrlichmann.conf \
        /etc/nginx/sites-available/dr-ehrlichmann.de
sudo ln -sf /etc/nginx/sites-available/dr-ehrlichmann.de \
            /etc/nginx/sites-enabled/dr-ehrlichmann.de
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t        # Syntax prüfen (meldet noch fehlende Zertifikate – ok)
```

## 5. TLS-Zertifikat (HTTPS)

```bash
sudo certbot --nginx -d dr-ehrlichmann.de -d www.dr-ehrlichmann.de \
     --agree-tos -m praxis@dr-ehrlichmann.de --redirect
sudo systemctl reload nginx
```

certbot trägt die Zertifikatspfade automatisch ein und erneuert sie selbst.
Test: <https://dr-ehrlichmann.de> sollte laden (grünes Schloss).

---

## 6. Formular-Backend (Termin / Kontakt / Frage)

```bash
# Dienst-Dateien an festen Ort
sudo mkdir -p /opt/dentalia-forms
sudo cp /opt/dentalia-site/deploy/form-service/* /opt/dentalia-forms/
cd /opt/dentalia-forms
sudo npm ci --omit=dev          # installiert nodemailer
# unprivilegierter Dienstbenutzer + Backup-Verzeichnis
sudo adduser --system --group dentalia
sudo mkdir -p /var/lib/dentalia-forms
sudo chown dentalia:dentalia /var/lib/dentalia-forms /opt/dentalia-forms

# .env aus Vorlage erstellen und SMTP-Daten eintragen
sudo cp .env.example .env
sudo nano .env        # SMTP_HOST/USER/PASS = __POSTFACH-ZUGANG__ eintragen
sudo chown dentalia:dentalia .env && sudo chmod 600 .env

# systemd-Dienst starten
sudo cp dentalia-forms.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable --now dentalia-forms
sudo systemctl status dentalia-forms     # active (running) erwartet
curl -s http://127.0.0.1:8787/api/health # {"ok":true}
```

**Einstellungen (bereits so vorkonfiguriert, Inhaber-Entscheid 2026-06-26):**
Empfänger = **nur** `praxis@dr-ehrlichmann.de` · Patienten-**Auto-Antwort = AN** ·
**Backup = AN** (`/var/lib/dentalia-forms/<typ>-JJJJ-MM.jsonl`).

Test: auf der Live-Seite `/kontakt` eine Test-Nachricht senden → Mail muss bei
`praxis@` ankommen + Auto-Antwort beim Absender.

---

## 7. Auto-Deploy über GitHub Actions (einmalig)

Damit künftige Änderungen (deine Code-Updates **und** Inhaltsänderungen aus dem
CMS) automatisch live gehen:

1. SSH-Schlüssel für den Deploy-Benutzer erzeugen (auf dem VPS):
   ```bash
   sudo -u deploy ssh-keygen -t ed25519 -f /home/deploy/.ssh/id_deploy -N ""
   sudo -u deploy bash -c 'cat /home/deploy/.ssh/id_deploy.pub >> /home/deploy/.ssh/authorized_keys'
   sudo -u deploy cat /home/deploy/.ssh/id_deploy   # PRIVATER Schlüssel – gleich kopieren
   ```
2. In GitHub → Repo → **Settings → Secrets and variables → Actions** anlegen:
   - `SSH_HOST` = `__VPS_IP__`
   - `SSH_USER` = `deploy`
   - `SSH_KEY` = *(der eben angezeigte private Schlüssel, komplett)*
   - `SSH_PORT` = `22` (nur falls abweichend)
3. Fertig: Der Workflow `.github/workflows/deploy.yml` baut + deployt bei jedem
   Push auf `main` automatisch. Manuell auslösbar über **Actions → Run workflow**.

> Bis CI eingerichtet ist (oder als Fallback) kannst du jederzeit auf dem VPS
> `bash /opt/dentalia-site/deploy/deploy.sh` ausführen — pullt, baut, veröffentlicht.

---

## 8. CMS (Sveltia) scharf schalten

1. In `public/admin/config.yml` `repo: OWNER/REPO` durch `__github-login__/__repo-name__` ersetzen, committen.
2. GitHub-Anmeldung für Sveltia einrichten (GitHub-Backend braucht OAuth) — siehe
   <https://github.com/sveltia/sveltia-cms#readme> (Abschnitt *Backend / GitHub*).
3. Aufrufen: `https://dr-ehrlichmann.de/admin` → mit GitHub einloggen → Artikel/
   Seiten bearbeiten, Speichern committet nach GitHub → CI deployt automatisch.

---

## 9. Go-Live-Checkliste

- [ ] `https://dr-ehrlichmann.de` lädt, grünes Schloss, `www` + `http` leiten auf die kanonische URL um.
- [ ] Stichproben: `/leistungen`, `/ratgeber/karies-behandeln`, `/kontakt` (ohne Trailing-Slash, kein 404).
- [ ] Formulare: Termin- + Kontaktformular senden → Mail bei `praxis@` + Auto-Antwort.
- [ ] E-Mail-Test (mail-tester.com ≥ 9/10; SPF/DKIM/DMARC = PASS).
- [ ] `/admin` Login + Test-Edit → erscheint nach ~1–2 Min auf der Seite.
- [ ] Echte **PageSpeed**-Messung (PSI) auf der Live-Domain (Ziel 100).
- [ ] **Cookie-Banner / GA4 / Zipchat**: erst aktivieren, wenn gewünscht — dann
      Consent-Banner + Script-Gating ergänzen (aktuell setzt die Seite **keine**
      Cookies, daher noch kein Banner nötig, § 25 TDDDG).
- [ ] Rechtstexte (Impressum/Datenschutz) durch Anwalt/DSB freigegeben → siehe `ANWALT-DSGVO-CHECKLISTE.md`.

---

## 10. Alltag — wer ändert was

| Aufgabe | Wer / wie |
|---------|-----------|
| Artikel, Texte, Bilder, Kommentare freigeben | Inhaber, in `/admin` (Sveltia) → Auto-Deploy |
| Design, Funktionen, Fehlerbehebung, neue Blöcke | mit Claudes Hilfe → Push nach GitHub → Auto-Deploy |
| Eingegangene Formular-Anfragen | E-Mail an `praxis@` + Backup `/var/lib/dentalia-forms/` |

**Wichtig:** Sowohl CMS-Edits als auch Code-Änderungen laufen über **dasselbe
GitHub-Repo** → vor manuellen Edits immer den aktuellen Stand ziehen (`git pull`),
damit nichts kollidiert.
