# Kasir Wedangan Arjuna — aturan proyek

- Spesifikasi lengkap: SPESIFIKASI-KASIR-ARJUNA.md di root repo (baca dulu).
- Kerjakan per fase (Bagian 11). Fase 1 = kasir lokal tanpa sinkron/PIN/shift.
- Bahasa UI: Indonesia. Kode, nama tabel & variabel: Inggris.
- Offline-first: UI hanya baca/tulis Dexie. Jangan pernah menunggu jaringan di alur kasir.
- Setiap perubahan data = 1 transaksi Dexie yang menulis baris data + entri outbox.
- ID: UUID v7 dibuat di klien (`src/lib/id.ts`). Upsert di server idempoten berdasarkan id.
- Uang: integer Rupiah. Jangan pakai float. Format tampilan lewat `src/lib/money.ts`.
- Waktu: simpan ISO UTC, tampilkan Asia/Jakarta (`src/lib/time.ts`).
- Transaksi lunas bersifat immutable; koreksi lewat void/refund.
- order_items menyimpan snapshot nama & harga.
- Backend lewat interface SyncAdapter (Supabase/PocketBase); printer lewat PrinterService.
- Wajib uji: Vitest untuk rumus total/kembalian/shift; Playwright untuk alur bayar dalam mode offline.
- Mobile-first, target layar 360–412 px, tombol min 44 px.

## Perintah

- `npm run dev` · `npm run build` · `npm run lint` · `npm run typecheck` · `npm test` · `npm run test:e2e`
- Playwright menguji build produksi (service worker hanya aktif di build). Pertama kali: `npx playwright install chromium`.

## Keputusan fase 0

- UI: React 19 + Vite + TypeScript (dipilih; Svelte tidak dipakai). TypeScript dipin ke 5.9 karena typescript-eslint belum mendukung TS 7.
- Backend belum dipilih (Supabase vs PocketBase); ditunda di balik `SyncAdapter`, dikerjakan di fase 2.
