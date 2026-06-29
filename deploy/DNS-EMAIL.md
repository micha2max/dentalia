# E-Mail-Zustellbarkeit: SPF · DKIM · DMARC

> **RU (für den Inhaber):** Чтобы письма с форм (заявки на приём + авто-ответы
> пациенту) **не попадали в спам**, для домена `dr-ehrlichmann.de` нужны три
> DNS-записи: **SPF**, **DKIM**, **DMARC**. Их добавляют там, где управляется DNS
> домена (Hostinger → *Domains → DNS / Nameservers → DNS-Zone*). Ниже —
> готовые значения. Если почта `praxis@` уже работает через Hostinger Mail,
> SPF/DKIM, скорее всего, **уже стоят** — нужно только проверить и добавить DMARC.

Diese drei Einträge sagen empfangenden Servern (Gmail, Outlook …), dass unser
Mailserver berechtigt ist, im Namen von `dr-ehrlichmann.de` zu senden.

Das Formular-Backend versendet über **SMTP des E-Mail-Anbieters** (Standard:
Hostinger Mail, `smtp.hostinger.com`). Deshalb müssen SPF/DKIM den **Anbieter**
abdecken — nicht den VPS. Wichtig: `MAIL_FROM` muss auf `@dr-ehrlichmann.de`
lauten (so konfiguriert), damit SPF/DKIM greifen.

---

## 1) SPF (TXT)

Genau **ein** SPF-Record pro Domain. Wenn schon einer existiert, den
Hostinger-`include` ergänzen statt einen zweiten anzulegen.

| Typ | Name/Host | Wert |
|-----|-----------|------|
| TXT | `@` (dr-ehrlichmann.de) | `v=spf1 include:_spf.mail.hostinger.com ~all` |

> Anderer SMTP-Anbieter? Dann dessen include nehmen, z. B. Office365
> `include:spf.protection.outlook.com`, Brevo `include:spf.sendinblue.com` usw.

## 2) DKIM (vom Anbieter generiert)

DKIM signiert jede Mail kryptografisch. Den Schlüssel **generiert der
E-Mail-Anbieter** — bei Hostinger: *hPanel → Emails → E-Mail-Konto →
„DNS-Einträge / E-Mail konfigurieren"* → dort werden 1–2 DKIM-Einträge
angezeigt. Diese **exakt** so übernehmen. Typisch:

| Typ | Name/Host | Wert |
|-----|-----------|------|
| TXT (oder CNAME) | `hostingermail1._domainkey` | *(vom hPanel angezeigter Schlüssel)* |
| TXT (oder CNAME) | `hostingermail2._domainkey` | *(vom hPanel angezeigter Schlüssel)* |

> Bei anderen Anbietern heißt der Selector anders (z. B. `s1._domainkey`,
> `google._domainkey`). Immer die vom Anbieter vorgegebenen Werte verwenden.

## 3) DMARC (TXT)

Sagt, was mit Mails passieren soll, die SPF/DKIM **nicht** bestehen, und
schickt Reports.

| Typ | Name/Host | Wert |
|-----|-----------|------|
| TXT | `_dmarc` | `v=DMARC1; p=quarantine; rua=mailto:praxis@dr-ehrlichmann.de; ruf=mailto:praxis@dr-ehrlichmann.de; fo=1; adkim=s; aspf=s` |

Empfehlung: mit `p=quarantine` starten; nach 2–4 Wochen ohne Probleme auf
`p=reject` verschärfen.

---

## Prüfen (nach ~1–24 h DNS-Propagierung)

- **Senden-Test:** über das Kontaktformular eine Test-Anfrage abschicken →
  in Gmail die Mail öffnen → *„Original anzeigen"* → SPF, DKIM, DMARC müssen
  **PASS** zeigen.
- Online-Checks: <https://www.mail-tester.com> (Score ≥ 9/10 anstreben),
  <https://mxtoolbox.com/dmarc.aspx>, <https://dmarcian.com>.
- CLI: `dig TXT dr-ehrlichmann.de +short` · `dig TXT _dmarc.dr-ehrlichmann.de +short`

## Häufige Fehler

- **Zwei SPF-Records** → ungültig. Es darf nur einer existieren (includes kombinieren).
- `MAIL_FROM` zeigt auf eine andere Domain als SMTP → SPF/DKIM scheitern. Beide
  müssen `@dr-ehrlichmann.de` sein (bereits so in `.env`).
- DKIM aus hPanel nur „ungefähr" kopiert → Signatur ungültig. Wert exakt übernehmen.
