# Deploy ke VPS (wedangan-arjuna.nwsn.cc)

Aplikasi ini hanya berkas statis (hasil `npm run build`). Yang dibutuhkan di VPS: Nginx + sertifikat HTTPS.
**HTTPS wajib**: service worker (mode offline) dan pemasangan PWA tidak jalan di HTTP.

## 1. DNS

Buat record **A** `wedangan-arjuna.nwsn.cc` → IP publik VPS (dan **AAAA** bila VPS punya IPv6).

## 2. Sekali saja di VPS

```bash
sudo apt update && sudo apt install -y nginx certbot python3-certbot-nginx rsync
sudo mkdir -p /var/www/wedangan-arjuna && sudo chown $USER /var/www/wedangan-arjuna
sudo cp deploy/nginx.conf /etc/nginx/sites-available/wedangan-arjuna.nwsn.cc
sudo ln -s /etc/nginx/sites-available/wedangan-arjuna.nwsn.cc /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
sudo certbot --nginx -d wedangan-arjuna.nwsn.cc   # setelah DNS aktif
```

Buka port 80 dan 443 di firewall VPS.

## 3. Tiap rilis (dari laptop)

```bash
DEPLOY_HOST=user@IP-VPS ./deploy/deploy.sh
```

## 4. Setelah live

- Buka https://wedangan-arjuna.nwsn.cc di Chrome HP kasir → menu ⋮ → **Pasang aplikasi**.
- Buka sekali saat online agar aset ter-cache, lalu coba mode pesawat.
- Update: begitu HP online, service worker mengambil versi baru otomatis (`autoUpdate`).
- Data transaksi hanya ada di HP sampai sinkron fase 2: ekspor cadangan rutin.
