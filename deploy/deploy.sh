#!/usr/bin/env bash
# Pakai: DEPLOY_HOST=user@IP-VPS ./deploy/deploy.sh
# Membangun aplikasi lalu menyalin dist/ ke VPS. Tidak menyimpan kredensial apa pun.
set -euo pipefail

: "${DEPLOY_HOST:?Isi DEPLOY_HOST, mis. DEPLOY_HOST=deploy@203.0.113.10}"
REMOTE_DIR="${REMOTE_DIR:-/var/www/wedangan-arjuna}"

cd "$(dirname "$0")/.."
npm ci
npm run lint
npm test
npm run build

# --delete menghapus berkas lama di server; sw.js & index.html ikut diganti sekaligus.
rsync -az --delete dist/ "$DEPLOY_HOST:$REMOTE_DIR/"
echo "Selesai: https://wedangan-arjuna.nwsn.cc"
