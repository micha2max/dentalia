// Mirror the live WordPress media library into public/ 1:1 (same paths).
// Enumerates every attachment + every registered size variant (-WxH) via the
// WP REST media API, so the existing image URLs (Google-Images!) stay valid.
// Run: node scripts/mirror-images.mjs
import fs from 'node:fs';
import path from 'node:path';

const BASE = 'https://dr-ehrlichmann.de';
const OUT = 'public';
const CONCURRENCY = 10;

async function getAllMedia() {
  const all = [];
  let page = 1;
  while (true) {
    const r = await fetch(`${BASE}/wp-json/wp/v2/media?per_page=100&page=${page}`);
    if (!r.ok) break;
    const arr = await r.json();
    if (!Array.isArray(arr) || arr.length === 0) break;
    all.push(...arr);
    const totalPages = +(r.headers.get('x-wp-totalpages') || 1);
    if (page >= totalPages) break;
    page++;
  }
  return all;
}

function urlToLocal(u) {
  const i = u.indexOf('/wp-content/');
  if (i < 0) return null;
  return path.join(OUT, u.slice(i));
}

async function dl(u) {
  const local = urlToLocal(u);
  if (!local) return 'skip';
  if (fs.existsSync(local)) return 'exists';
  try {
    const r = await fetch(u);
    if (!r.ok) return `fail ${r.status}`;
    const buf = Buffer.from(await r.arrayBuffer());
    fs.mkdirSync(path.dirname(local), { recursive: true });
    fs.writeFileSync(local, buf);
    return 'ok';
  } catch (e) {
    return `err ${e.message}`;
  }
}

const media = await getAllMedia();
const urls = new Set();
for (const m of media) {
  if (m.source_url) urls.add(m.source_url);
  const sizes = (m.media_details && m.media_details.sizes) || {};
  for (const k in sizes) if (sizes[k].source_url) urls.add(sizes[k].source_url);
}
// extra static assets to preserve
for (const p of [
  '/wp-content/uploads/2020/06/checkliste_urlaub.pdf',
  '/wp-content/uploads/2019/02/anamnesebogen_dr_ehrlichmann.pdf',
]) urls.add(BASE + p);

const list = [...urls];
console.log(`media attachments: ${media.length} · urls to mirror: ${list.length}`);

let i = 0, ok = 0, exists = 0, fail = 0;
async function worker() {
  while (i < list.length) {
    const u = list[i++];
    const res = await dl(u);
    if (res === 'ok') ok++;
    else if (res === 'exists') exists++;
    else { fail++; if (fail <= 20) console.log('  ', res, u); }
    if ((ok + exists + fail) % 50 === 0) console.log(`  ${ok + exists + fail}/${list.length}`);
  }
}
await Promise.all(Array.from({ length: CONCURRENCY }, worker));
console.log(`DONE — downloaded ${ok}, already ${exists}, failed ${fail}, total ${list.length}`);
