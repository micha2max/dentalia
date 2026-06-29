// Build-time helper: pick a sharp, lightweight thumbnail variant for a mirrored
// WordPress image used in a CARD slot. Card media renders ~390px wide (≈780px on
// retina), so the full-size master is wasteful and some heroes are ultra-wide
// banners that don't downscale to a nice ~3:2 thumbnail. WordPress generated
// cropped variants (name-750x500.jpg, name-768x512.jpg, …) that are mirrored
// alongside the original under public/. This returns the best landscape crop that
// actually exists on disk, else the original path unchanged.
//
// Re-migration-safe: lives in code, never edits content. The canonical full-size
// image URL (article lead, lightbox target) is left untouched — use this ONLY for
// decorative card thumbnails.
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const PUBLIC = fileURLToPath(new URL('../../public', import.meta.url));

// Crop suffixes that suit a ~390px (×2 = 780px) card slot, best first.
const PREFERRED = [
  '-750x500', '-768x512', '-768x511', '-600x400', '-750x499',
  '-768x432', '-750x450', '-750x422', '-768x460', '-555x500',
];

function variant(path, suffix) {
  const m = path.match(/^(.*)(\.[a-z0-9]+)$/i);
  return m ? m[1] + suffix + m[2] : null;
}

export function cardImg(path) {
  if (typeof path !== 'string' || !path.startsWith('/wp-content/uploads/')) return path;
  // Already a sized crop (…-WxH.ext) — leave it as authored.
  if (/-\d+x\d+\.[a-z0-9]+$/i.test(path)) return path;
  for (const s of PREFERRED) {
    const v = variant(path, s);
    if (v && existsSync(PUBLIC + v)) return v;
  }
  return path;
}
