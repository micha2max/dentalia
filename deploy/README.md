# deploy/ — Hostinger VPS deployment package

Everything needed to put **dr-ehrlichmann.de** live on a Hostinger VPS.
Start with **`DEPLOY-ANLEITUNG.md`** (step-by-step, RU + commands).

| File | What it is |
|------|------------|
| `DEPLOY-ANLEITUNG.md` | **Main guide** — full setup, go-live checklist, day-to-day workflow. |
| `nginx/dr-ehrlichmann.conf` | nginx server config (TLS, no-trailing-slash, headers, gzip, `/api` proxy). |
| `form-service/` | Node form backend (Termin/Kontakt/Frage) → email + auto-reply + JSONL backup. `server.mjs`, `package.json`, `.env.example`, `dentalia-forms.service`. |
| `DNS-EMAIL.md` | SPF / DKIM / DMARC so form mail doesn't land in spam. |
| `deploy.sh` | Manual VPS-side deploy (pull → build → publish → reload). |
| `../.github/workflows/deploy.yml` | GitHub Actions auto-deploy on push to `main`. |

**Owner decisions baked in:** EU host (Hostinger VPS), recipient = `praxis@` only,
patient auto-reply ON, submission backup ON. **Placeholders to fill:** `__VPS_IP__`,
SMTP credentials, `__github-login__/__repo-name__`, GitHub Actions SSH secrets.

**Still owner/lawyer tasks (not code):** AVV/DPA with Hostinger; lawyer/DSB review
of Impressum + Datenschutz (`../ANWALT-DSGVO-CHECKLISTE.md`); cookie banner only
once GA4/Zipchat are added.
