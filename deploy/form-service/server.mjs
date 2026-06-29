// Dentalia form backend — Zahnarztpraxis Dr. Natalia Ehrlichmann
// ----------------------------------------------------------------------------
// A tiny dependency-light Node service (only `nodemailer`) that receives the
// three site forms, e-mails the practice, sends the patient an auto-reply, and
// keeps a JSONL backup of every submission. Runs behind nginx as a systemd
// service; nginx proxies /api/* here. No framework, no database.
//
// Endpoints (POST, application/x-www-form-urlencoded):
//   /api/terminanfrage  – appointment request
//   /api/kontakt        – contact message
//   /api/kommentar      – reader question on an article (goes to moderation)
//
// Settings (per owner decision 2026-06-26): recipient = praxis@ ONLY (no CC),
// patient auto-reply = ON, submission backup = ON (file, see DATA_DIR).
// Spam defence: honeypot field `website` + simple per-IP rate limit.
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import nodemailer from 'nodemailer';

// ---- config from environment (see .env.example) ----------------------------
const env = process.env;
const PORT = Number(env.PORT || 8787);
const HOST = env.HOST || '127.0.0.1';
const MAIL_TO = env.MAIL_TO || 'praxis@dr-ehrlichmann.de';
const MAIL_FROM = env.MAIL_FROM || 'Zahnarztpraxis Dr. Ehrlichmann <praxis@dr-ehrlichmann.de>';
const AUTOREPLY = String(env.AUTOREPLY ?? 'true') === 'true';
const DATA_DIR = env.DATA_DIR || './data';
const ALLOWED_ORIGIN = env.ALLOWED_ORIGIN || 'https://dr-ehrlichmann.de';
const SITE = env.SITE_URL || 'https://dr-ehrlichmann.de';
const RATE_MAX = Number(env.RATE_MAX || 6);          // submissions …
const RATE_WINDOW_MS = Number(env.RATE_WINDOW_MS || 10 * 60 * 1000); // … per IP per 10 min

const transporter = nodemailer.createTransport({
  host: env.SMTP_HOST,
  port: Number(env.SMTP_PORT || 587),
  secure: String(env.SMTP_SECURE ?? 'false') === 'true', // true for 465, false for 587 (STARTTLS)
  auth: { user: env.SMTP_USER, pass: env.SMTP_PASS },
});

// ---- form definitions ------------------------------------------------------
const esc = (s) => String(s ?? '').replace(/[<>&]/g, (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;' }[c]));
const F = (name, label, required = true) => ({ name, label, required });

const FORMS = {
  '/api/terminanfrage': {
    type: 'terminanfrage',
    subject: (d) => `Neue Terminanfrage – ${d.vorname} ${d.nachname}`,
    fields: [
      F('vorname', 'Vorname'), F('nachname', 'Nachname'),
      F('telefon', 'Telefon'), F('email', 'E-Mail'),
      F('status', 'Patient'), F('terminart', 'Grund des Termins'),
      F('datum', 'Wunschdatum'), F('uhrzeit', 'Wunschzeit'),
      F('nachricht', 'Nachricht', false),
    ],
    autoReplySubject: 'Ihre Terminanfrage bei Zahnarztpraxis Dr. Ehrlichmann',
    autoReplyText: (d) =>
      `Guten Tag ${d.vorname} ${d.nachname},\n\n` +
      `vielen Dank für Ihre Terminanfrage. Wir haben sie erhalten und melden uns ` +
      `zeitnah mit einem Terminvorschlag bei Ihnen.\n\n` +
      `Bei akuten Beschwerden erreichen Sie uns telefonisch unter 02247 7171.\n\n` +
      `Herzliche Grüße\nIhr Praxisteam Dr. Natalia Ehrlichmann\n` +
      `Zeithstraße 117, 53819 Neunkirchen-Seelscheid`,
  },
  '/api/kontakt': {
    type: 'kontakt',
    subject: (d) => `Neue Kontaktanfrage – ${d.vorname} ${d.nachname}`,
    fields: [
      F('vorname', 'Vorname'), F('nachname', 'Nachname'),
      F('telefon', 'Telefon'), F('email', 'E-Mail'),
      F('anliegen', 'Anliegen'),
    ],
    autoReplySubject: 'Ihre Nachricht an Zahnarztpraxis Dr. Ehrlichmann',
    autoReplyText: (d) =>
      `Guten Tag ${d.vorname} ${d.nachname},\n\n` +
      `vielen Dank für Ihre Nachricht. Wir haben sie erhalten und melden uns so ` +
      `bald wie möglich bei Ihnen.\n\n` +
      `Herzliche Grüße\nIhr Praxisteam Dr. Natalia Ehrlichmann\n` +
      `Zeithstraße 117, 53819 Neunkirchen-Seelscheid`,
  },
  '/api/kommentar': {
    type: 'kommentar',
    moderation: true,
    subject: (d) => `Neue Frage zum Artikel (#${d.post || '?'}) – ${d.name}`,
    fields: [
      F('name', 'Name'), F('email', 'E-Mail'),
      F('frage', 'Frage'), F('post', 'Artikel-ID', false),
    ],
    autoReplySubject: 'Ihre Frage an Zahnarztpraxis Dr. Ehrlichmann',
    autoReplyText: (d) =>
      `Guten Tag ${d.name},\n\n` +
      `vielen Dank für Ihre Frage. Sie wird von unserem Team geprüft und nach ` +
      `Freigabe auf der Website beantwortet.\n\n` +
      `Herzliche Grüße\nIhr Praxisteam Dr. Natalia Ehrlichmann`,
  },
};

// ---- helpers ---------------------------------------------------------------
const rate = new Map(); // ip -> [timestamps]
function rateLimited(ip) {
  const now = Date.now();
  const hits = (rate.get(ip) || []).filter((t) => now - t < RATE_WINDOW_MS);
  hits.push(now);
  rate.set(ip, hits);
  return hits.length > RATE_MAX;
}

function readBody(req, limit = 64 * 1024) {
  return new Promise((resolve, reject) => {
    let data = '';
    req.on('data', (c) => {
      data += c;
      if (data.length > limit) { reject(new Error('payload too large')); req.destroy(); }
    });
    req.on('end', () => resolve(data));
    req.on('error', reject);
  });
}

function parseBody(raw, ctype) {
  if ((ctype || '').includes('application/json')) {
    try { return JSON.parse(raw); } catch { return {}; }
  }
  return Object.fromEntries(new URLSearchParams(raw)); // urlencoded
}

function backup(type, record) {
  try {
    fs.mkdirSync(DATA_DIR, { recursive: true });
    const d = new Date();
    const month = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    fs.appendFileSync(path.join(DATA_DIR, `${type}-${month}.jsonl`), JSON.stringify(record) + '\n');
  } catch (e) { console.error('[backup] failed:', e.message); }
}

function practiceEmail(form, d) {
  const rows = form.fields
    .filter((f) => d[f.name])
    .map((f) => `${f.label}: ${d[f.name]}`)
    .join('\n');
  const text =
    `${form.moderation ? 'Eine neue Frage wurde eingereicht (Moderation erforderlich).' : 'Eine neue Anfrage ist eingegangen.'}\n\n` +
    `${rows}\n\n— gesendet über das Formular auf ${SITE}`;
  const htmlRows = form.fields
    .filter((f) => d[f.name])
    .map((f) => `<tr><td style="padding:4px 12px 4px 0;color:#667;vertical-align:top"><b>${esc(f.label)}</b></td><td style="padding:4px 0">${esc(d[f.name]).replace(/\n/g, '<br>')}</td></tr>`)
    .join('');
  const html =
    `<div style="font-family:Inter,Arial,sans-serif;font-size:15px;color:#222">` +
    `<p>${form.moderation ? 'Eine neue <b>Frage</b> wurde eingereicht (Moderation erforderlich).' : 'Eine neue Anfrage ist eingegangen.'}</p>` +
    `<table style="border-collapse:collapse">${htmlRows}</table>` +
    `<p style="color:#889;font-size:13px;margin-top:18px">gesendet über das Formular auf ${esc(SITE)}</p></div>`;
  return { text, html };
}

function ok(res, form, asJson) {
  if (asJson) { res.writeHead(200, { 'content-type': 'application/json' }); return res.end(JSON.stringify({ ok: true })); }
  res.writeHead(200, { 'content-type': 'text/html; charset=utf-8' });
  res.end(
    `<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">` +
    `<title>Vielen Dank</title><body style="font-family:Inter,Arial,sans-serif;max-width:560px;margin:12vh auto;padding:0 24px;color:#222;text-align:center">` +
    `<h1 style="color:#057a8d">Vielen Dank!</h1><p>Wir haben Ihre Anfrage erhalten und melden uns zeitnah bei Ihnen.</p>` +
    `<p><a href="${esc(SITE)}" style="color:#057a8d;font-weight:600">Zurück zur Startseite</a></p></body>`
  );
}

// ---- request handling ------------------------------------------------------
const server = http.createServer(async (req, res) => {
  const urlPath = (req.url || '').split('?')[0];

  if (req.method === 'GET' && urlPath === '/api/health') {
    res.writeHead(200, { 'content-type': 'application/json' });
    return res.end(JSON.stringify({ ok: true }));
  }

  const form = FORMS[urlPath];
  if (req.method !== 'POST' || !form) { res.writeHead(404); return res.end('Not found'); }

  const asJson =
    (req.headers['x-requested-with'] === 'fetch') ||
    (req.headers['accept'] || '').includes('application/json');
  const fail = (code, msg) => {
    if (asJson) { res.writeHead(code, { 'content-type': 'application/json' }); return res.end(JSON.stringify({ ok: false, error: msg })); }
    res.writeHead(code, { 'content-type': 'text/plain; charset=utf-8' }); res.end(msg);
  };

  // origin check (only enforced when the browser sends Origin)
  const origin = req.headers.origin;
  if (origin && origin !== ALLOWED_ORIGIN) return fail(403, 'Forbidden');

  const ip = (req.headers['x-forwarded-for'] || '').split(',')[0].trim() || req.socket.remoteAddress || 'unknown';
  if (rateLimited(ip)) return fail(429, 'Zu viele Anfragen. Bitte später erneut versuchen.');

  let d;
  try { d = parseBody(await readBody(req), req.headers['content-type']); }
  catch { return fail(413, 'Anfrage zu groß.'); }

  // honeypot: silently accept (pretend success) but do nothing
  if (d.website) return ok(res, form, asJson);

  // validation
  if (!d.consent) return fail(400, 'Bitte stimmen Sie der Datenschutzerklärung zu.');
  for (const f of form.fields) {
    if (f.required && !String(d[f.name] || '').trim()) return fail(400, `Bitte füllen Sie das Feld "${f.label}" aus.`);
  }

  const record = { type: form.type, at: new Date().toISOString(), ip, moderated: form.moderation ? false : undefined, data: d };
  backup(form.type, record);

  const mail = practiceEmail(form, d);
  try {
    await transporter.sendMail({
      from: MAIL_FROM, to: MAIL_TO, replyTo: d.email || undefined,
      subject: form.subject(d), text: mail.text, html: mail.html,
    });
    if (AUTOREPLY && d.email && form.autoReplyText) {
      await transporter.sendMail({
        from: MAIL_FROM, to: d.email,
        subject: form.autoReplySubject, text: form.autoReplyText(d),
      });
    }
  } catch (e) {
    console.error('[mail] send failed:', e.message);
    // submission is already backed up to disk → tell the user it worked, but log.
  }

  return ok(res, form, asJson);
});

server.listen(PORT, HOST, () => console.log(`[dentalia-forms] listening on http://${HOST}:${PORT}`));
