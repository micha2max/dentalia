#!/usr/bin/env bash
# Manual deploy — run ON the Hostinger VPS from the repo checkout.
# (Day-to-day, GitHub Actions does this automatically on every push; this script
#  is the fallback / for the first deploy and for server-side rebuilds.)
set -euo pipefail

REPO_DIR="${REPO_DIR:-/opt/dentalia-site}"          # git checkout of this repo
WEBROOT="${WEBROOT:-/var/www/dr-ehrlichmann.de}"     # nginx root
BRANCH="${BRANCH:-main}"

echo "==> Pulling latest ($BRANCH)"
cd "$REPO_DIR"
git fetch --quiet origin "$BRANCH"
git reset --hard "origin/$BRANCH"

echo "==> Installing deps"
npm ci

echo "==> Building"
npm run build

echo "==> Verifying internal links"
node scripts/check-links.mjs

echo "==> Publishing to $WEBROOT"
sudo mkdir -p "$WEBROOT"
sudo rsync -a --delete dist/ "$WEBROOT/"

echo "==> Reloading nginx"
sudo nginx -t && sudo systemctl reload nginx

echo "==> Done."
