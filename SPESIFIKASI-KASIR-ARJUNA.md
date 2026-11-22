# Spesifikasi Aplikasi Kasir & Manajemen — Wedangan Arjuna

> Dokumen bekal proyek. Dipakai sebagai konteks untuk membangun aplikasi (mis. di Claude Code).
> Versi dokumen: 1.1 · 22 November 2026 · Bahasa: Indonesia
> Perubahan 1.1: fase 1 menjadi "kasir lokal" (tanpa sinkron, PIN, shift); kursor pull memakai `server_updated_at`; status "habis" dipisah dari baris produk; rumus diskon/pajak/kas diperjelas; catatan keamanan PIN.
>
> Tanda yang dipakai:
> - **[KEPUTUSAN]**: sudah diputuskan Fajar.
> - **[ASUMSI]**: tebakan yang belum dikonfirmasi. Ubah kalau keliru.
> - **[TANYA]**: masih harus dijawab (lihat Bagian 12).

---

## Daftar isi

1. [Ringkasan proyek](#1-ringkasan-proyek)
2. [Data menu lengkap](#2-data-menu-lengkap)
3. [Tujuan & kebutuhan](#3-tujuan--kebutuhan)
4. [Teknologi (stack)](#4-teknologi-stack)
5. [Arsitektur offline-first & sinkronisasi](#5-arsitektur-offline-first--sinkronisasi)
6. [Fitur kasir](#6-fitur-kasir)
7. [Fitur manajemen](#7-fitur-manajemen)
8. [Model data](#8-model-data)
9. [Alur layar](#9-alur-layar)
10. [Printer Bluetooth & struk](#10-printer-bluetooth--struk)
11. [Tahapan pengerjaan](#11-tahapan-pengerjaan)
12. [Pertanyaan terbuka & asumsi](#12-pertanyaan-terbuka--asumsi)
13. [Panduan untuk Claude Code](#13-panduan-untuk-claude-code)
14. [Lampiran](#14-lampiran)

---

## 1. Ringkasan proyek

| Hal | Isi |
|---|---|
| Usaha | **Wedangan Arjuna**: warung wedangan (minuman rempah tradisional, kopi, teh) dan makanan ringan/berat |
| Slogan | "Rasa Ningrat, Harga Merakyat" · "Ngombene Anget, Ngobrole Raket" |
| Kontak pemesanan | 085-111-357-657 |
| Kanal online | ShopeeFood (tercantum di menu) |
| Perangkat kasir | **1 HP Android** yang khusus dipakai untuk transaksi kasir |
| Masalah utama | Listrik bisa mati dan internet bisa putus, tapi penjualan tidak boleh berhenti |
| Solusi | Aplikasi kasir **offline-first**: semua transaksi disimpan di HP dulu, lalu disinkronkan ke server saat online |
| Pengguna | Kasir (operasional harian) dan pemilik/manajer (menu, harga, stok, laporan) |

Prinsip utama:
1. **Jualan tidak boleh berhenti.** Semua fungsi kasir harus jalan 100% tanpa internet.
2. **Tidak ada data hilang.** Transaksi tersimpan permanen di HP sebelum dianggap selesai, lalu tersalin ke server.
3. **Cepat dipakai.** Satu transaksi biasa selesai dalam kurang dari 10 detik dengan sentuhan jempol.
4. **Tertata.** Pemilik bisa melihat omzet, stok, pengeluaran, dan selisih kas per shift.

---

## 2. Data menu lengkap

Sumber: PDF menu "Putih Hitam dan Emas Modern Menu Makanan" (3 halaman, dibuat di Canva). Harga di PDF ditulis "10k", artinya Rp 10.000.

**Ringkasan: 59 item dalam 9 kategori dan 2 kelompok (Makanan & Minuman).**

| Kelompok | Kategori | Jumlah item | Harga termurah – termahal |
|---|---|---:|---|
| Makanan | Nasi | 5 | 10.000 – 15.000 |
| Makanan | Lalapan | 2 | 23.000 – 25.000 |
| Makanan | Mie | 5 | 7.000 – 13.000 |
| Makanan | Kudapan / Snack | 3 | 5.000 – 8.000 |
| Minuman | Wedang Sehat | 14 | 7.000 – 15.000 |
| Minuman | Kopi & Susu | 9 | 4.000 – 12.000 |
| Minuman | Teh & Jeruk | 7 | 5.000 – 12.000 |
| Minuman | Es Segar Tradisi | 11 | 5.000 – 10.000 |
| Minuman | STMJ (Susu Telur Madu Jahe) | 3 | 13.000 – 18.000 |
| | **Total** | **59** | |

### 2.1 Makanan

#### Nasi
| Kode | Nama | Harga (Rp) | Catatan |
|---|---|---:|---|
| NSI-01 | Nasi Goreng Arjuna | 10.000 | Menu andalan (nama toko) |
| NSI-02 | Soto Ayam Boyolali | 10.000 | Ada di halaman Nasi pada PDF |
| NSI-03 | Nasi Goreng Telur | 12.000 | Bergambar di menu |
| NSI-04 | Nasi Goreng Teri | 15.000 | |
| NSI-05 | Nasi Goreng Mawut | 15.000 | |

#### Lalapan
| Kode | Nama | Harga (Rp) | Catatan |
|---|---|---:|---|
| LLP-01 | Ayam Goreng | 23.000 | [ASUMSI] sudah termasuk nasi & lalapan |
| LLP-02 | Ayam Goreng Laos | 25.000 | Bergambar di menu |

#### Mie
| Kode | Nama | Harga (Rp) | Catatan |
|---|---|---:|---|
| MIE-01 | Indomie Goreng/Kuah | 7.000 | **Varian wajib dipilih:** Goreng atau Kuah. Di seed bernama "Indomie" + varian; struk menampilkan "Indomie (Kuah)" |
| MIE-02 | Indomie Telur | 10.000 | [TANYA] ada pilihan goreng/kuah juga? |
| MIE-03 | Bakmie Godok Jawa | 13.000 | PDF menulis "BakMie" |
| MIE-04 | Bakmie Goreng Jawa | 13.000 | |
| MIE-05 | Bakmie Nyemek Arjuna | 13.000 | Bergambar di menu |

#### Kudapan / Snack
| Kode | Nama | Harga (Rp) | Catatan |
|---|---|---:|---|
| KDP-01 | Tempe Mendoan (isi 4) | 5.000 | Satu porsi berisi 4 potong |
| KDP-02 | Tempura (Mix) | 8.000 | |
| KDP-03 | Kentang Goreng | 8.000 | |

### 2.2 Minuman

#### Wedang Sehat
| Kode | Nama | Harga (Rp) | Catatan |
|---|---|---:|---|
| WDG-01 | Wedang Jahe Arjuna | 7.000 | |
| WDG-02 | Wedang Jahe Gula Aren | 8.000 | |
| WDG-03 | Wedang Jahe Rempah Spesial | 10.000 | |
| WDG-04 | Wedang Kunir Asem Rempah | 10.000 | |
| WDG-05 | Wedang Rempah Rapet Wangi | 10.000 | |
| WDG-06 | Wedang Rempah Sapu Angin | 12.000 | |
| WDG-07 | Wedang Susu Kunir Rempah | 10.000 | |
| WDG-08 | Wedang Susu Jahe Rempah | 10.000 | |
| WDG-09 | Wedang Uwuh Arjuna | 10.000 | |
| WDG-10 | Wedang Sehat Pria | 10.000 | |
| WDG-11 | Wedang Rempah Pegal Linu | 12.000 | |
| WDG-12 | Wedang Rempah Pelangsing | 13.000 | |
| WDG-13 | Wedang Sehat Datang Bulan | 13.000 | |
| WDG-14 | Wedang Rempah Stamina | 15.000 | |

#### Kopi & Susu
| Kode | Nama | Harga (Rp) | Catatan |
|---|---|---:|---|
| KPS-01 | Kopi Rakyat | 4.000 | Item termurah di menu |
| KPS-02 | Kopi Robusta | 6.000 | |
| KPS-03 | Kopi Robusta Rempah | 8.000 | |
| KPS-04 | Susu Hangat | 8.000 | |
| KPS-05 | Kopi Gula Aren | 10.000 | |
| KPS-06 | Kopi Arabika | 10.000 | |
| KPS-07 | Susu Coklat Hangat | 10.000 | PDF menulis "Susu Coklat hangat" |
| KPS-08 | Kopi Susu Jahe | 12.000 | |
| KPS-09 | Kopi Arabika Rempah | 12.000 | |

#### Teh & Jeruk
| Kode | Nama | Harga (Rp) | Catatan |
|---|---|---:|---|
| TJR-01 | Teh Hangat | 5.000 | |
| TJR-02 | Teh Kampul | 7.000 | |
| TJR-03 | Teh Ginastel Gula Batu | 8.000 | Ginastel = legi, panas, kentel |
| TJR-04 | Teh Sereh Rempah | 10.000 | |
| TJR-05 | Teh Susu Rempah | 12.000 | |
| TJR-06 | Wedang Jeruk | 8.000 | Jeruk hangat |
| TJR-07 | Wedang Teh Lemon Gula Batu | 10.000 | |

#### Es Segar Tradisi
| Kode | Nama | Harga (Rp) | Catatan |
|---|---|---:|---|
| ESG-01 | Es Teh Manis | 5.000 | |
| ESG-02 | Es Lemon Tea | 8.000 | |
| ESG-03 | Es Susu | 8.000 | |
| ESG-04 | Es Jeruk | 10.000 | |
| ESG-05 | Es Susu Jahe Rempah | 10.000 | |
| ESG-06 | Es Kunir Asem | 10.000 | |
| ESG-07 | Es Susu Kunir Rempah | 10.000 | |
| ESG-08 | Es Coklat Rempah | 10.000 | |
| ESG-09 | Es Jahe Rempah | 10.000 | |
| ESG-10 | Es Teh Susu Rempah | 10.000 | |
| ESG-11 | Es Teh Sereh Rempah | 10.000 | PDF menulis "Sere"; disamakan jadi "Sereh" seperti TJR-04 |

#### STMJ (Susu Telur Madu Jahe)
| Kode | Nama | Harga (Rp) | Catatan |
|---|---|---:|---|
| STM-01 | STMJ Rempah | 13.000 | |
| STM-02 | STMJ Coklat Rempah | 16.000 | |
| STM-03 | STMJ Rempah Stamina | 18.000 | Item minuman termahal |

### 2.3 Catatan & temuan dari menu

1. **Panas vs es.** Ada minuman yang muncul dalam versi panas dan es dengan harga sendiri, misalnya Wedang Jeruk (8.000) dan Es Jeruk (10.000), atau Teh Susu Rempah (12.000) dan Es Teh Susu Rempah (10.000). Di aplikasi, **setiap versi dicatat sebagai item terpisah**, bukan varian. Dengan begitu harga dan laporannya tetap jelas.
2. **Varian tanpa beda harga.** Indomie Goreng/Kuah memakai *pilihan varian* (harga sama) yang tercetak di struk dan pesanan dapur.
3. **Ejaan** dirapikan untuk aplikasi ("BakMie" jadi "Bakmie", "Sere" jadi "Sereh"). Nama di struk sebaiknya mengikuti ejaan yang sudah dirapikan.
4. **Menu bergambar** (bisa diberi tanda "Favorit" di aplikasi): Nasi Goreng Telur, Soto Ayam Boyolali, Lalapan Ayam Laos, Mie Nyemek.
5. **Harga ShopeeFood** biasanya lebih tinggi dari harga di warung. [TANYA] Apakah pesanan ShopeeFood dicatat di kasir ini? Kalau ya, aplikasi butuh *daftar harga per kanal* (lihat 7.1).
6. **Topping/tambahan** (extra telur, extra nasi, kurangi gula, dll.) tidak ada di menu. [TANYA] Apakah perlu? Desain data sudah menyiapkan *modifier* (lihat 8).

### 2.4 Data awal (seed) siap pakai

Format JSON untuk mengisi database pertama kali. `price` dalam Rupiah (bilangan bulat).

```json
{
  "categories": [
    { "id": "nasi",    "name": "Nasi",             "group": "makanan", "sort": 1 },
    { "id": "lalapan", "name": "Lalapan",          "group": "makanan", "sort": 2 },
    { "id": "mie",     "name": "Mie",              "group": "makanan", "sort": 3 },
    { "id": "kudapan", "name": "Kudapan / Snack",  "group": "makanan", "sort": 4 },
    { "id": "wedang",  "name": "Wedang Sehat",     "group": "minuman", "sort": 5 },
    { "id": "kopi",    "name": "Kopi & Susu",      "group": "minuman", "sort": 6 },
    { "id": "teh",     "name": "Teh & Jeruk",      "group": "minuman", "sort": 7 },
    { "id": "es",      "name": "Es Segar Tradisi", "group": "minuman", "sort": 8 },
    { "id": "stmj",    "name": "STMJ",             "group": "minuman", "sort": 9 }
  ],
  "products": [
    { "sku": "NSI-01", "category": "nasi", "name": "Nasi Goreng Arjuna", "price": 10000, "favorite": true },
    { "sku": "NSI-02", "category": "nasi", "name": "Soto Ayam Boyolali", "price": 10000, "favorite": true },
    { "sku": "NSI-03", "category": "nasi", "name": "Nasi Goreng Telur", "price": 12000, "favorite": true },
    { "sku": "NSI-04", "category": "nasi", "name": "Nasi Goreng Teri", "price": 15000 },
    { "sku": "NSI-05", "category": "nasi", "name": "Nasi Goreng Mawut", "price": 15000 },
    { "sku": "LLP-01", "category": "lalapan", "name": "Ayam Goreng", "price": 23000 },
    { "sku": "LLP-02", "category": "lalapan", "name": "Ayam Goreng Laos", "price": 25000, "favorite": true },
    { "sku": "MIE-01", "category": "mie", "name": "Indomie", "price": 7000, "variants": ["Goreng", "Kuah"], "variantRequired": true },
    { "sku": "MIE-02", "category": "mie", "name": "Indomie Telur", "price": 10000 },
    { "sku": "MIE-03", "category": "mie", "name": "Bakmie Godok Jawa", "price": 13000 },
    { "sku": "MIE-04", "category": "mie", "name": "Bakmie Goreng Jawa", "price": 13000 },
    { "sku": "MIE-05", "category": "mie", "name": "Bakmie Nyemek Arjuna", "price": 13000, "favorite": true },
    { "sku": "KDP-01", "category": "kudapan", "name": "Tempe Mendoan (isi 4)", "price": 5000 },
    { "sku": "KDP-02", "category": "kudapan", "name": "Tempura (Mix)", "price": 8000 },
    { "sku": "KDP-03", "category": "kudapan", "name": "Kentang Goreng", "price": 8000 },
    { "sku": "WDG-01", "category": "wedang", "name": "Wedang Jahe Arjuna", "price": 7000 },
    { "sku": "WDG-02", "category": "wedang", "name": "Wedang Jahe Gula Aren", "price": 8000 },
    { "sku": "WDG-03", "category": "wedang", "name": "Wedang Jahe Rempah Spesial", "price": 10000 },
    { "sku": "WDG-04", "category": "wedang", "name": "Wedang Kunir Asem Rempah", "price": 10000 },
    { "sku": "WDG-05", "category": "wedang", "name": "Wedang Rempah Rapet Wangi", "price": 10000 },
    { "sku": "WDG-06", "category": "wedang", "name": "Wedang Rempah Sapu Angin", "price": 12000 },
    { "sku": "WDG-07", "category": "wedang", "name": "Wedang Susu Kunir Rempah", "price": 10000 },
    { "sku": "WDG-08", "category": "wedang", "name": "Wedang Susu Jahe Rempah", "price": 10000 },
    { "sku": "WDG-09", "category": "wedang", "name": "Wedang Uwuh Arjuna", "price": 10000 },
    { "sku": "WDG-10", "category": "wedang", "name": "Wedang Sehat Pria", "price": 10000 },
    { "sku": "WDG-11", "category": "wedang", "name": "Wedang Rempah Pegal Linu", "price": 12000 },
    { "sku": "WDG-12", "category": "wedang", "name": "Wedang Rempah Pelangsing", "price": 13000 },
    { "sku": "WDG-13", "category": "wedang", "name": "Wedang Sehat Datang Bulan", "price": 13000 },
    { "sku": "WDG-14", "category": "wedang", "name": "Wedang Rempah Stamina", "price": 15000 },
    { "sku": "KPS-01", "category": "kopi", "name": "Kopi Rakyat", "price": 4000 },
    { "sku": "KPS-02", "category": "kopi", "name": "Kopi Robusta", "price": 6000 },
    { "sku": "KPS-03", "category": "kopi", "name": "Kopi Robusta Rempah", "price": 8000 },
    { "sku": "KPS-04", "category": "kopi", "name": "Susu Hangat", "price": 8000 },
    { "sku": "KPS-05", "category": "kopi", "name": "Kopi Gula Aren", "price": 10000 },
    { "sku": "KPS-06", "category": "kopi", "name": "Kopi Arabika", "price": 10000 },
    { "sku": "KPS-07", "category": "kopi", "name": "Susu Coklat Hangat", "price": 10000 },
    { "sku": "KPS-08", "category": "kopi", "name": "Kopi Susu Jahe", "price": 12000 },
    { "sku": "KPS-09", "category": "kopi", "name": "Kopi Arabika Rempah", "price": 12000 },
    { "sku": "TJR-01", "category": "teh", "name": "Teh Hangat", "price": 5000 },
    { "sku": "TJR-02", "category": "teh", "name": "Teh Kampul", "price": 7000 },
    { "sku": "TJR-03", "category": "teh", "name": "Teh Ginastel Gula Batu", "price": 8000 },
    { "sku": "TJR-04", "category": "teh", "name": "Teh Sereh Rempah", "price": 10000 },
    { "sku": "TJR-05", "category": "teh", "name": "Teh Susu Rempah", "price": 12000 },
    { "sku": "TJR-06", "category": "teh", "name": "Wedang Jeruk", "price": 8000 },
    { "sku": "TJR-07", "category": "teh", "name": "Wedang Teh Lemon Gula Batu", "price": 10000 },
    { "sku": "ESG-01", "category": "es", "name": "Es Teh Manis", "price": 5000 },
    { "sku": "ESG-02", "category": "es", "name": "Es Lemon Tea", "price": 8000 },
    { "sku": "ESG-03", "category": "es", "name": "Es Susu", "price": 8000 },
    { "sku": "ESG-04", "category": "es", "name": "Es Jeruk", "price": 10000 },
    { "sku": "ESG-05", "category": "es", "name": "Es Susu Jahe Rempah", "price": 10000 },
    { "sku": "ESG-06", "category": "es", "name": "Es Kunir Asem", "price": 10000 },
    { "sku": "ESG-07", "category": "es", "name": "Es Susu Kunir Rempah", "price": 10000 },
    { "sku": "ESG-08", "category": "es", "name": "Es Coklat Rempah", "price": 10000 },
    { "sku": "ESG-09", "category": "es", "name": "Es Jahe Rempah", "price": 10000 },
    { "sku": "ESG-10", "category": "es", "name": "Es Teh Susu Rempah", "price": 10000 },
    { "sku": "ESG-11", "category": "es", "name": "Es Teh Sereh Rempah", "price": 10000 },
    { "sku": "STM-01", "category": "stmj", "name": "STMJ Rempah", "price": 13000 },
    { "sku": "STM-02", "category": "stmj", "name": "STMJ Coklat Rempah", "price": 16000 },
    { "sku": "STM-03", "category": "stmj", "name": "STMJ Rempah Stamina", "price": 18000 }
  ]
}
```

---

## 3. Tujuan & kebutuhan

### 3.1 Tujuan bisnis
- Mencatat **setiap penjualan** dengan rapi: tidak ada lagi catatan manual yang tercecer.
- Mengetahui **omzet harian, menu terlaris, dan jam ramai**.
- Mengontrol **uang kas** per shift: uang di laci harus sama dengan catatan.
- Mengontrol **stok bahan** (jahe, gula aren, susu, telur, mie, dll.) dan **pengeluaran** harian.
- Pemilik bisa memantau dari jauh saat online.

### 3.2 Pengguna & peran
| Peran | Siapa | Kebutuhan utama |
|---|---|---|
| **Kasir** | Penjaga warung | Input pesanan cepat, terima bayar, cetak struk, buka/tutup shift, catat pengeluaran kecil |
| **Pemilik / Manajer** | Fajar atau pemilik | Atur menu & harga, stok, lihat laporan, kelola pengguna, setujui pembatalan |

### 3.3 Kebutuhan fungsional (ringkas)
| Kode | Kebutuhan | Prioritas |
|---|---|---|
| F-01 | Pilih menu, keranjang, ubah jumlah, catatan per item | Wajib (MVP) |
| F-02 | Pembayaran tunai dengan hitung kembalian | Wajib (MVP) |
| F-03 | Pembayaran non-tunai (QRIS / transfer) | Wajib (MVP) |
| F-04 | Struk: cetak Bluetooth, bagikan WhatsApp, lihat di layar | Wajib (MVP: tampil & bagikan; cetak di fase 3) |
| F-05 | Semua fungsi kasir jalan tanpa internet | Wajib (MVP) |
| F-06 | Sinkron otomatis ke server saat online | Wajib (fase 2) |
| F-07 | Indikator online/offline (MVP); jumlah data belum terkirim (fase 2) | Wajib |
| F-08 | Riwayat transaksi & pembatalan (void) dengan alasan; MVP: konfirmasi + alasan tanpa PIN, PIN pemilik mulai fase 2 | Wajib (MVP) |
| F-09 | Buka/tutup shift dengan hitung kas | Wajib (fase 2) |
| F-10 | Kelola menu, kategori, harga, status habis | Wajib (fase 2) |
| F-11 | Pengguna & peran dengan PIN | Wajib (fase 2) |
| F-12 | Laporan harian / periode, ekspor CSV/Excel | Wajib (fase 2) |
| F-13 | Pengeluaran operasional | Wajib (fase 2) |
| F-14 | Stok bahan & resep (pengurangan otomatis) | Fase 4 |
| F-15 | Pesanan "simpan dulu, bayar nanti" (open bill per meja) | Fase 2 [TANYA] |
| F-16 | Diskon / promo | Fase 4 [TANYA] |
| F-17 | Dashboard web untuk pemilik | Fase 4 |

### 3.4 Kebutuhan non-fungsional
| Aspek | Target |
|---|---|
| Offline | Aplikasi bisa dibuka dan dipakai penuh dalam mode pesawat |
| Ketahanan data | Transaksi ditulis ke penyimpanan lokal sebelum struk muncul; tidak hilang saat HP mati mendadak |
| Kecepatan | Ketuk menu ke keranjang < 100 ms; layar siap < 2 detik setelah aplikasi dibuka |
| Layar | Mobile-first, potret, jempol satu tangan, tombol minimal 44×44 px |
| Bahasa | Antarmuka bahasa Indonesia, format Rupiah `Rp 10.000`, zona waktu **Asia/Jakarta (WIB)** [ASUMSI] |
| Keamanan | PIN per pengguna; pembatalan & ubah harga hanya untuk Pemilik; data server dilindungi aturan akses (RLS) |
| Audit | Setiap perubahan penting (void, ubah harga, koreksi stok, selisih kas) tercatat siapa dan kapan |
| Cadangan | Ekspor cadangan lokal (JSON) bisa dilakukan kapan saja tanpa internet |

---

## 4. Teknologi (stack)

| Lapisan | Pilihan | Status |
|---|---|---|
| Bentuk aplikasi | **PWA** (bisa dipasang dari Chrome ke layar utama) | [KEPUTUSAN] |
| Framework UI | **React** atau **Svelte**, dengan **Vite** | [KEPUTUSAN] salah satu; final [TANYA] |
| Bahasa | TypeScript | [ASUMSI] |
| Database lokal | **IndexedDB via Dexie.js** | [KEPUTUSAN] |
| Offline shell | `vite-plugin-pwa` (Workbox): precache semua aset | [ASUMSI] |
| Pembungkus native | **Capacitor** (Android) bila butuh printer Bluetooth klasik | [KEPUTUSAN] siap dibungkus |
| Backend | **Supabase** (Postgres) atau **PocketBase** | [TANYA] belum final |
| Hindari | Flutter | [KEPUTUSAN] |
| Styling | Tailwind CSS | [ASUMSI] |
| Uji | Vitest (logika) + Playwright (alur layar, mode offline) | [ASUMSI] |

### 4.1 Perbandingan backend (untuk diputuskan)
| | Supabase | PocketBase |
|---|---|---|
| Hosting | Cloud gratis (paket Free) atau self-host | Self-host 1 file binary (VPS kecil / Fly.io / Railway) |
| Database | Postgres: kuat untuk laporan SQL | SQLite: cukup untuk 1 toko |
| Auth & aturan akses | Ada (RLS) | Ada (API rules) |
| Realtime | Ada | Ada |
| Biaya | Gratis sampai batas tertentu; proyek Free bisa *pause* jika tidak aktif 7 hari | Hanya biaya VPS (mulai ±Rp 50–80 rb/bulan) |
| Kerumitan | Rendah (tanpa server sendiri) | Rendah–sedang (urus server sendiri) |
| Saran | **Disarankan** bila tidak ingin mengurus server | Bila ingin semua data di server sendiri |

Arsitektur sinkron di Bagian 5 dibuat **netral backend**: lapisan `SyncAdapter` dengan dua implementasi (Supabase/PocketBase), jadi pilihan bisa ditunda.

### 4.2 Kenapa PWA + Capacitor
- PWA: tanpa Play Store, update cukup deploy ulang, bisa dibuka juga di laptop pemilik.
- Risiko PWA: (a) data browser bisa terhapus kalau "Hapus data situs" di Chrome; (b) printer Bluetooth klasik (SPP) tidak bisa diakses dari browser.
- Mitigasi: minta `navigator.storage.persist()`, sinkron sesering mungkin, ekspor cadangan. Kalau printer jadi dipakai, bungkus dengan Capacitor dan gunakan plugin printer (Bagian 10). Kode yang sama tetap dipakai.

---

## 5. Arsitektur offline-first & sinkronisasi

### 5.1 Gambaran besar

```
┌──────────────────────── HP Kasir (PWA / Capacitor) ────────────────────────┐
│  UI (React/Svelte)                                                         │
│     │  baca/tulis                                                          │
│     ▼                                                                      │
│  Repositori lokal ──► Dexie (IndexedDB)  ◄── sumber kebenaran untuk UI     │
│     │                    ├─ data master (menu, harga, user, setelan)       │
│     │                    ├─ data transaksi (order, payment, shift, ...)    │
│     │                    └─ outbox (antrian perubahan belum terkirim)      │
│     ▼                                                                      │
│  Sync Engine (push outbox ▲ / pull perubahan ▼)                            │
│  Service Worker (cache aplikasi agar bisa dibuka offline)                  │
└───────────────┬────────────────────────────────────────────────────────────┘
                │ HTTPS, hanya saat online
                ▼
       Backend (Supabase / PocketBase) ──► Dashboard pemilik (web)
```

**Aturan emas:** UI **tidak pernah** menunggu server. Semua baca/tulis ke Dexie; sinkron berjalan di belakang.

### 5.2 Identitas & urutan
- Semua ID dibuat di HP: **UUID v7** (berurutan waktu), jadi aman dibuat offline tanpa bentrok.
- Nomor struk dibuat lokal: `ARJ-YYMMDD-NNN` (contoh `ARJ-261122-007`). Counter disimpan per tanggal di Dexie dan **tidak pernah dipakai ulang** walau transaksi dibatalkan.
- Setiap baris punya `created_at`, `updated_at` (waktu HP), `device_id`, `version` (angka naik tiap ubah), `synced_at` (null = belum terkirim), dan `deleted_at` (soft delete).
- Jam HP bisa salah. Server mengisi sendiri `server_updated_at` (dan `server_received_at` untuk audit) pada setiap upsert. **Kursor pull memakai `server_updated_at`, bukan `updated_at` dari HP.**
- Nomor struk dibuat per perangkat; tanggalnya ditentukan zona WIB saat transaksi dibayar (shift yang melewati tengah malam memakai tanggal bayar). Di server, kunci unik nomor struk adalah `(store_id, device_id, number)` agar HP kedua kelak tidak bentrok.

### 5.3 Pola outbox (push)
1. Setiap perubahan (buat order, bayar, void, pengeluaran, dll.) ditulis dalam **satu transaksi Dexie**: baris data **plus** satu entri `outbox` `{id, entity, entity_id, op, payload, created_at, attempts}`.
2. Sync engine mengambil outbox berurutan dan mengirim **batch** (mis. 50) ke server memakai **upsert berdasarkan `id`** (idempoten: terkirim dua kali tetap tercatat sekali).
3. Bila sukses: hapus entri outbox, set `synced_at`.
4. Bila gagal: `attempts++`, coba lagi dengan *exponential backoff* (5 dtk, 15 dtk, 1 mnt, 5 mnt, maks 15 mnt).
5. Pemicu sinkron: aplikasi dibuka, event `online`, setelah transaksi selesai, interval 60 detik saat online, tombol "Sinkron sekarang". (Background Sync API dipakai bila tersedia, tapi jangan diandalkan.)

### 5.4 Tarik perubahan (pull)
- Data master (menu, harga, kategori, pengguna, setelan, resep) bisa diubah dari dashboard pemilik. HP menarik baris dengan `server_updated_at > last_pulled_at` per tabel (waktu server, kebal terhadap jam HP yang salah), lalu menyimpan `last_pulled_at` dari nilai terbesar yang diterima.
- Menu & harga yang dipakai kasir **selalu dari salinan lokal**, jadi tetap jalan offline.

### 5.5 Aturan konflik
| Data | Siapa penulis | Aturan |
|---|---|---|
| Transaksi (order, item, pembayaran) | Hanya HP kasir | Baris `order_items` dan `payments` **tidak bisa diubah** setelah lunas (append-only). Pada `orders` hanya kolom status void/refund (`status`, `voided_*`, `void_reason`, `approved_by`, `version`) yang boleh berubah, lewat alur void/refund. Satu-satunya penulis adalah HP kasir, jadi tidak ada konflik. Order `open` (open bill) masih boleh diedit sampai dibayar. |
| Status "habis hari ini" | Kasir atau pemilik | Disimpan di tabel `product_availability` terpisah (bukan di baris produk), agar tidak menimpa harga yang diedit pemilik. |
| Void / refund | HP kasir (dengan PIN pemilik) | Dicatat sebagai baris baru + status order berubah. Server menerima apa adanya. |
| Menu, harga, kategori | Pemilik (HP atau dashboard) | *Last-write-wins* berdasarkan `version` lalu `updated_at`. |
| Stok | Pergerakan (movement) append-only | Saldo stok = jumlah semua movement, dihitung ulang. Tidak ada konflik. |
| Shift | HP kasir | Satu shift aktif per perangkat. |

**Harga dibekukan di transaksi:** `order_items` menyimpan nama & harga **saat itu** (snapshot), jadi laporan lama tidak berubah kalau harga naik.

### 5.6 Penyimpanan aman di HP
- Panggil `navigator.storage.persist()` saat pertama dibuka; tampilkan peringatan kalau ditolak.
- Tampilkan jumlah data belum terkirim di header. Kalau lebih dari 24 jam belum sinkron, tampilkan peringatan kuning.
- Fitur **Ekspor cadangan** (JSON semua tabel) & **Impor cadangan**.
- Jangan pernah menghapus data lokal yang `synced_at` masih null.
- Data transaksi lama (> 90 hari dan sudah sinkron) boleh dipangkas dari HP agar ringan [ASUMSI]. Setelah dipangkas, laporan periode lama hanya tersedia dari server/dashboard. Pemangkasan hanya jalan dari fase 2 (sebelum ada sinkron, tidak ada yang dipangkas).

### 5.7 Indikator status
| Status | Tampilan |
|---|---|
| Online, semua terkirim | Titik hijau "Online" |
| Online, sedang kirim | Ikon berputar "Mengirim… (n)" |
| Online, ada antrean gagal | Kuning "n belum terkirim", ketuk untuk detail error |
| Offline | Merah "Offline · n antre" + bar tipis "Transaksi tetap tersimpan di HP" |

### 5.8 Listrik mati
HP pakai baterai sendiri, jadi aplikasi tetap jalan. Yang mati biasanya router WiFi. Aplikasi otomatis masuk mode offline. [ASUMSI] HP punya paket data seluler sebagai cadangan. Kalau ada, sinkron tetap jalan lewat data seluler.

---

## 6. Fitur kasir

### 6.1 Layar Kasir (POS)
- Header: nama toko, nama kasir & shift, indikator online/offline.
- Kolom cari menu (cari sebagian nama, tanpa peduli huruf besar/kecil).
- Chip kategori yang bisa digeser + chip "Favorit".
- Grid kartu menu: nama, harga, badge jumlah di keranjang, abu-abu bila **Habis**.
- Ketuk = tambah 1. Tekan lama = buka detail (varian, catatan, jumlah).
- Item dengan varian wajib (Indomie) langsung membuka pemilih "Goreng / Kuah".
- Bar keranjang melayang di bawah: "3 item · Rp 25.000".

### 6.2 Keranjang
- Daftar item: nama + varian + catatan, tombol − / +, subtotal; geser untuk hapus.
- Field opsional: **nama pelanggan / nomor meja**, **tipe pesanan**: Makan di tempat / Bungkus / Online (ShopeeFood) [TANYA].
- Catatan per item (mis. "kurang manis", "tanpa es").
- Tombol: Kosongkan, **Simpan (open bill)** [fase 2], **Bayar**.

### 6.3 Pembayaran
- Ringkasan: subtotal, diskon (bila ada), pajak/service (bila diaktifkan), **Total**.
- Metode: **Tunai**, **QRIS**, **Transfer** [ASUMSI]; mendukung **split payment** (sebagian tunai + QRIS) [fase 2].
- Tunai: input nominal dengan keypad angka besar, tombol cepat (Uang pas, pembulatan ke 5rb/10rb/20rb/50rb/100rb), kembalian besar dan berwarna. Tombol Bayar nonaktif bila uang kurang.
- QRIS: tampilkan gambar QRIS statis toko (diunggah di Pengaturan), kasir menekan "Sudah dibayar" setelah cek notifikasi. Simpan nomor referensi opsional.
- Setelah bayar: data tersimpan di Dexie, **lalu** muncul layar sukses (kembalian + struk).

### 6.4 Struk & pesanan dapur
- Layar sukses: kembalian besar, tombol **Cetak**, **Bagikan (WhatsApp)**, **Transaksi baru**.
- Cetak ulang dari Riwayat.
- [TANYA] Perlu **tiket dapur** (tanpa harga, hanya item + catatan + nama/meja)?

### 6.5 Riwayat & pembatalan
- Daftar transaksi per tanggal/shift: nomor, jam, total, metode, status (Lunas / Batal), status sinkron.
- Detail transaksi, cetak ulang, bagikan.
- **Void** (batal penuh): wajib alasan (pilihan: Salah input, Pelanggan batal, Lainnya + teks) dan **PIN Pemilik** [ASUMSI]. Di fase 1 (belum ada pengguna) cukup dialog konfirmasi + alasan; PIN pemilik diwajibkan mulai fase 2. Transaksi void tetap tersimpan, ditandai, dan tidak dihitung di omzet.
- [Fase 2] **Refund sebagian** (kembalikan sebagian item).

### 6.6 Shift / tutup kasir
- **Buka shift:** pilih kasir + PIN, isi **modal awal** (uang di laci).
- Selama shift: semua transaksi & pengeluaran terkait shift ini.
- **Tutup shift:** aplikasi menghitung **kas seharusnya** = modal awal + penjualan tunai − refund tunai − pengeluaran tunai ± kas masuk/keluar. Kasir mengisi **kas fisik** (bisa pakai hitung per pecahan: 100rb, 50rb, ... 500, 100). Aplikasi menampilkan **selisih**, kasir isi catatan bila selisih ≠ 0.
- Cetak/bagikan **laporan tutup shift** (ringkasan penjualan, per metode bayar, pengeluaran, selisih).
- Transaksi tidak bisa dibuat tanpa shift aktif [ASUMSI]. Berlaku mulai fase 2; di fase 1 belum ada shift, jadi `orders.shift_id` boleh null dan diisi saat shift aktif.

### 6.7 Pengeluaran & kas keluar/masuk (oleh kasir)
- Catat pengeluaran kecil dari laci: kategori (Bahan baku, Gas/LPG, Es batu, Kebersihan, Lain-lain), nominal, catatan, foto nota opsional [fase 4].
- Kas masuk/keluar non-penjualan (mis. tambah uang kembalian, setor ke pemilik).

---

## 7. Fitur manajemen

### 7.1 Menu & harga
- CRUD kategori (urutan, kelompok Makanan/Minuman, aktif/nonaktif).
- CRUD produk: SKU, nama, kategori, harga, foto opsional, favorit, aktif, **status Habis hari ini** (kasir juga boleh menandai habis).
- Varian (mis. Goreng/Kuah) & **modifier** berbayar opsional (mis. +Telur Rp 3.000) [TANYA].
- **Riwayat harga** (siapa ubah, kapan, dari berapa ke berapa).
- [TANYA] **Daftar harga per kanal**: Harga Warung vs Harga ShopeeFood.
- Impor/ekspor menu (CSV).

### 7.2 Stok (fase 4)
Dua tingkat, dipilih per produk:
1. **Stok produk jadi** (mis. Tempe Mendoan, Tempura bila dibuat per batch): stok berkurang per penjualan.
2. **Stok bahan baku + resep** (mis. 1 Wedang Jahe Gula Aren = 15 g jahe + 20 g gula aren + 1 gelas): stok bahan berkurang otomatis per penjualan.

Fitur:
- Master bahan: nama, satuan (g, ml, pcs, bungkus), stok minimum, harga beli terakhir.
- Pergerakan stok: **Masuk** (pembelian), **Keluar otomatis** (penjualan), **Penyesuaian** (stok opname, rusak, tumpah).
- Peringatan stok menipis di dashboard.
- Laporan HPP (harga pokok) & perkiraan laba kotor per menu, bila resep dan harga beli diisi.

### 7.3 Laporan
| Laporan | Isi | Filter |
|---|---|---|
| Ringkasan harian | Omzet, jumlah transaksi, rata-rata per transaksi, per metode bayar, void | Tanggal |
| Penjualan per menu | Qty & nilai, peringkat terlaris/terendah | Periode, kategori |
| Penjualan per kategori / kelompok | Makanan vs Minuman | Periode |
| Penjualan per jam | Jam ramai (grafik batang) | Periode |
| Per kasir / shift | Omzet, selisih kas | Periode, kasir |
| Pengeluaran | Per kategori | Periode |
| Laba sederhana | Omzet − pengeluaran (− HPP bila stok aktif) | Periode |
| Void & refund | Daftar beserta alasan & yang menyetujui | Periode |
| Stok | Saldo, pergerakan, menipis | Tanggal |

- Semua laporan bisa **dilihat offline** dari data lokal HP (untuk data di HP itu).
- Ekspor **CSV / Excel (.xlsx)** dan bagikan.
- Rentang: Hari ini, Kemarin, 7 hari, Bulan ini, Pilih tanggal.

### 7.4 Pengguna & peran
| Hak akses | Kasir | Pemilik |
|---|:---:|:---:|
| Transaksi, cetak struk | ✅ | ✅ |
| Buka/tutup shift | ✅ | ✅ |
| Catat pengeluaran | ✅ | ✅ |
| Tandai menu habis | ✅ | ✅ |
| Void / refund | 🔐 butuh PIN pemilik | ✅ |
| Ubah harga & menu | ❌ | ✅ |
| Lihat laporan semua hari | ❌ (hanya shift sendiri) | ✅ |
| Kelola stok | ❌ (hanya lihat) [ASUMSI] | ✅ |
| Kelola pengguna & pengaturan | ❌ | ✅ |

- Login di HP memakai **PIN 4–6 digit** (offline). PIN disimpan sebagai hash ber-*salt* (bcrypt/argon2 di server; di HP disalin sebagai hash).
- **Batas keamanan:** PIN pendek yang hash-nya ada di HP bisa ditebak lewat brute force offline. Karena itu: batasi percobaan (kunci 1 menit setelah 5 salah, makin lama bila berulang) dan anggap PIN sebagai pengaman terhadap salah pakai/kasir iseng, bukan terhadap penyerang yang menguasai HP.
- HP terhubung ke backend dengan **satu akun perangkat** (device account). Kasir berganti cukup dengan PIN.
- Kunci otomatis setelah tidak aktif X menit [ASUMSI 10 menit].

### 7.5 Pengaturan
- Profil toko: nama, alamat, telepon, logo struk, catatan kaki struk.
- Pajak (PB1 10%) & service charge: aktif/nonaktif, persen, termasuk/di luar harga [TANYA].
- Pembulatan total (mis. ke Rp 500 terdekat) [TANYA].
- Metode pembayaran aktif + gambar QRIS statis.
- Printer: pasangkan, ukuran kertas 58/80 mm, uji cetak, cetak otomatis setelah bayar.
- Sinkron: status, terakhir sinkron, tombol sinkron, ekspor/impor cadangan.
- ID perangkat & versi aplikasi.

### 7.6 Audit log
Catat: login, buka/tutup shift, void/refund, ubah harga, ubah menu, koreksi stok, ubah pengaturan, impor cadangan. Isi: siapa, kapan, apa, nilai sebelum & sesudah.

---

## 8. Model data

Nama tabel & kolom dalam bahasa Inggris (konvensi kode); label UI dalam bahasa Indonesia. Uang disimpan sebagai **integer Rupiah** (bukan float). Waktu dalam ISO-8601 UTC; tampilan dikonversi ke WIB.

Kolom standar di **semua tabel yang disinkron**:
`id (uuid v7, PK)`, `created_at`, `updated_at`, `deleted_at (null)`, `version (int)`, `device_id`, `synced_at (lokal saja)`, `server_updated_at (diisi server; dipakai kursor pull)`.

### 8.1 Master
```
stores        (id, name, address, phone, receipt_footer, logo_url, tax_rate, tax_inclusive, service_rate, rounding)
devices       (id, store_id, name, last_seen_at, app_version)
users         (id, store_id, name, role['owner','cashier'], pin_hash, active)
categories    (id, store_id, name, group['makanan','minuman'], sort, active)
products      (id, store_id, category_id, sku, name, price, image_url, favorite, active,
               track_stock['none','product','recipe'], stock_qty (cache))
product_availability (id, product_id, sold_out_date (date))      -- "habis hari ini"; tabel terpisah agar tidak menimpa edit harga
product_variants   (id, product_id, name, price_delta, sort)        -- Goreng / Kuah
modifiers          (id, store_id, name, price, active)              -- +Telur, dll. [opsional]
product_modifiers  (product_id, modifier_id)
price_lists        (id, store_id, name ['Warung','ShopeeFood'])      -- [opsional]
product_prices     (product_id, price_list_id, price)               -- [opsional]
payment_methods    (id, store_id, code['cash','qris','transfer'], name, active, qris_image_url)
```

### 8.2 Transaksi
```
shifts        (id, store_id, device_id, opened_by, opened_at, opening_cash,
               closed_by, closed_at, expected_cash, counted_cash, cash_diff, note,
               denominations (json))
orders        (id, store_id, shift_id (null di fase 1), number 'ARJ-261122-007' (unik per store_id+device_id), status['open','paid','void','refunded_partial'],
               order_type['dine_in','takeaway','online'], customer_name, table_no,
               subtotal, discount_total, tax_total, service_total, rounding, total,
               cashier_id, paid_at, voided_at, voided_by, void_reason, approved_by, note)
order_items   (id, order_id, product_id, sku, name_snapshot, variant_name, modifiers (json),
               unit_price, qty, discount, line_total, note)
payments      (id, order_id, method_code, amount, tendered, change, reference, paid_at)
refunds       (id, order_id, reason, amount, method_code, approved_by, items (json))
cash_movements(id, shift_id, type['in','out'], amount, reason, created_by)
expenses      (id, store_id, shift_id, category, amount, note, paid_from['cash_drawer','owner'], receipt_photo_url, created_by)
```

### 8.3 Stok (fase 4)
```
ingredients     (id, store_id, name, unit, min_stock, last_cost, active)
recipes         (id, product_id, ingredient_id, qty)          -- per 1 porsi
stock_movements (id, store_id, ingredient_id|product_id, type['purchase','sale','adjust','waste'],
                 qty (+/-), unit_cost, ref_order_id, note, created_by)
```
Saldo stok = `SUM(qty)` per bahan. Tidak ada kolom saldo yang diedit langsung (kecuali cache untuk tampilan).

### 8.4 Sistem (lokal)
```
outbox     (id, entity, entity_id, op['upsert','delete'], payload, created_at, attempts, last_error)
sync_state (table_name, last_pulled_at)
counters   (key 'order-2026-11-22', value)
audit_log  (id, store_id, user_id, action, entity, entity_id, before (json), after (json), at)
kv         (key, value)                                 -- setelan lokal
```

### 8.5 Contoh skema Dexie
Contoh **sebagian**: tabel lain (refunds, payment_methods, product_availability, product_modifiers, price_lists, ingredients, recipes, dll.) ditambahkan lewat `db.version(n)` saat fiturnya dikerjakan.
```ts
db.version(1).stores({
  categories: 'id, sort, updated_at',
  products: 'id, category_id, sku, name, updated_at',
  product_variants: 'id, product_id',
  users: 'id, role',
  shifts: 'id, opened_at, closed_at',
  orders: 'id, number, status, shift_id, paid_at, [status+paid_at]',
  order_items: 'id, order_id, product_id',
  payments: 'id, order_id, method_code',
  expenses: 'id, shift_id, created_at',
  cash_movements: 'id, shift_id',
  stock_movements: 'id, ingredient_id, product_id, created_at',
  outbox: 'id, created_at, entity',
  sync_state: 'table_name',
  counters: 'key',
  audit_log: 'id, at',
  kv: 'key'
});
```

### 8.6 Contoh satu transaksi (payload sinkron)
```json
{
  "order": {
    "id": "01936f2a-7c1e-7b2a-9e1f-3c4d5e6f7a8b",
    "number": "ARJ-261122-007",
    "status": "paid", "order_type": "dine_in", "table_no": "3",
    "subtotal": 25000, "discount_total": 0, "tax_total": 0, "service_total": 0, "rounding": 0, "total": 25000,
    "shift_id": "01936f00-...", "cashier_id": "01936e11-...",
    "paid_at": "2026-11-22T11:05:12Z", "device_id": "HP-KASIR-1", "version": 1
  },
  "items": [
    { "id": "…", "sku": "NSI-01", "name_snapshot": "Nasi Goreng Arjuna", "unit_price": 10000, "qty": 2, "line_total": 20000 },
    { "id": "…", "sku": "ESG-01", "name_snapshot": "Es Teh Manis", "unit_price": 5000, "qty": 1, "line_total": 5000, "note": "kurang manis" }
  ],
  "payments": [
    { "id": "…", "method_code": "cash", "amount": 25000, "tendered": 30000, "change": 5000 }
  ]
}
```

### 8.7 Rumus
- `line_total = (unit_price + Σ modifier) × qty − discount` (`discount` = diskon per baris)
- `subtotal = Σ line_total` (sudah memuat diskon per baris)
- `discount_total` = **hanya diskon tingkat pesanan** (bukan jumlah diskon baris, agar tidak terhitung dua kali)
- `base = subtotal − discount_total`
- `service_total = round(base × service_rate)`
- Pajak di luar harga: `tax_total = round((base + service_total) × tax_rate)`
- Pajak sudah termasuk harga: `tax_total = round((base + service_total) × tax_rate / (1 + tax_rate))` dan **tidak ditambahkan** ke total (hanya ditampilkan di struk)
- `total = base + service_total + (tax_total bila di luar harga) + rounding`
- `rounding` bertanda (+/−), mis. total 32.300 dibulatkan ke 500 → `rounding = +200`
- `change = tendered − amount` (hanya tunai)
- `expected_cash (shift) = opening_cash + Σ payments.amount metode tunai (lunas, tanpa kembalian) − Σ refund tunai − Σ pengeluaran dari laci + Σ kas masuk − Σ kas keluar`

---

## 9. Alur layar

### 9.1 Peta layar
```
[Splash / cek data]
   └─► [Pilih pengguna + PIN]
          └─► (belum ada shift?) ─► [Buka shift: modal awal]
                 └─► [KASIR / POS] ◄─────────────────────────────┐
                        ├─► [Detail item: varian/catatan/qty]    │
                        ├─► [Keranjang] ─► [Pembayaran] ─► [Sukses + Struk] ─┘
                        └─► Navigasi bawah:
                              ├─ Kasir
                              ├─ Pesanan (open bill) [fase 2]
                              ├─ Riwayat ─► [Detail transaksi] ─► Void (PIN) / Cetak ulang
                              ├─ Laporan ─► Harian · Per menu · Per jam · Shift · Pengeluaran
                              └─ Lainnya ─► Pengeluaran · Kas masuk/keluar · Tutup shift
                                            Menu & harga · Stok · Pengguna · Pengaturan
                                            Printer · Sinkron & cadangan
```

### 9.2 Alur transaksi tunai (jalur utama)
1. Kasir mengetuk menu di grid; badge jumlah naik, bar keranjang muncul.
2. Ketuk bar keranjang, cek item, isi meja (opsional).
3. Ketuk **Bayar** dan pilih **Tunai** (default).
4. Ketuk tombol cepat (mis. "50.000") atau ketik nominal. Kembalian muncul besar.
5. Ketuk **Selesaikan**. Data tersimpan di HP, masuk outbox, dan struk tercetak otomatis bila printer aktif.
6. Layar sukses menampilkan kembalian. Ketuk **Transaksi baru** untuk kembali ke grid kosong.

Target: 4–6 ketukan untuk pesanan 2–3 item.

### 9.3 Alur void
Riwayat → pilih transaksi → **Batalkan** → pilih alasan → **PIN pemilik** → status Batal, tercatat di audit log, dan masuk outbox.

### 9.4 Alur tutup shift
Lainnya → **Tutup shift** → ringkasan (penjualan per metode, pengeluaran, kas seharusnya) → isi kas fisik (per pecahan atau total) → lihat selisih + catatan → **Tutup** → cetak/bagikan laporan shift → layar login.

### 9.5 Pedoman UI
- Warna mengikuti menu: **coklat tua** (#3B2216), **emas** (#C9963B), krem (#F6EFE6).
- Font tebal untuk harga; angka total & kembalian besar.
- Navigasi bawah maksimal 5 ikon.
- Konfirmasi hanya untuk aksi berisiko (void, kosongkan keranjang, tutup shift).
- Getar singkat saat item ditambahkan (bila didukung).
- Mode layar tetap menyala (Wake Lock API) saat shift aktif [ASUMSI].

---

## 10. Printer Bluetooth & struk

### 10.1 Pilihan cara cetak
| Cara | Bekerja di | Kelebihan | Kekurangan |
|---|---|---|---|
| **A. Capacitor + plugin Bluetooth (SPP)**, kirim perintah ESC/POS | APK Android (Capacitor) | Paling stabil, cocok untuk hampir semua printer thermal murah | Perlu build APK |
| **B. Web Bluetooth (BLE)** dari PWA | Chrome Android | Tanpa APK | Hanya printer yang mendukung BLE GATT; banyak printer murah hanya SPP |
| **C. Aplikasi perantara RawBT** (intent/URL scheme) | PWA + aplikasi RawBT terpasang | Mudah, tanpa APK sendiri | Bergantung aplikasi pihak ketiga |
| **D. `window.print()`** via layanan cetak Android | PWA | Paling sederhana | Lambat, sering tidak cocok untuk thermal |

**Rekomendasi:** MVP memakai D/C (cetak via RawBT, atau bagikan WhatsApp). Saat printer sudah dibeli, pindah ke **A** dengan membungkus PWA memakai Capacitor. Siapkan lapisan `PrinterService` dengan implementasi `rawbt`, `webbluetooth`, `capacitor-bt` agar mudah diganti.

Plugin/library yang bisa dipertimbangkan: library pembangun ESC/POS (mis. `esc-pos-encoder`), plugin Capacitor Bluetooth Serial / Bluetooth LE. Pilih yang masih aktif dirawat saat mulai fase 3.

### 10.2 Spesifikasi printer [TANYA]
- Lebar kertas: **58 mm** (32 karakter/baris font A) [ASUMSI] atau 80 mm (48 karakter).
- Koneksi: Bluetooth.
- Perintah: ESC/POS.

### 10.3 Format struk 58 mm (32 kolom)
```
        WEDANGAN ARJUNA
  Rasa Ningrat, Harga Merakyat
       Telp 085-111-357-657
--------------------------------
No   : ARJ-261122-007
Tgl  : 22/11/2026 18:05
Kasir: Sari        Meja: 3
--------------------------------
Nasi Goreng Arjuna
  2 x 10.000             20.000
Es Teh Manis
  1 x 5.000               5.000
  * kurang manis
Indomie (Kuah)
  1 x 7.000               7.000
--------------------------------
TOTAL                    32.000
Tunai                    50.000
Kembali                  18.000
--------------------------------
 Ngombene Anget, Ngobrole Raket
   Juga tersedia di ShopeeFood
         Terima kasih
```
- Nama item panjang dipotong/dibungkus ke baris berikutnya.
- Angka rata kanan, format ribuan titik.
- Struk void bertanda `*** DIBATALKAN ***`. Cetak ulang bertanda `-- CETAK ULANG --`.
- Opsi: logo kecil (bitmap) di atas, QR menuju Instagram/ShopeeFood [TANYA].

### 10.4 Struk digital
- **Bagikan** teks struk via Web Share API (WhatsApp, dll.).
- Opsi kirim ke nomor WA pelanggan lewat tautan `https://wa.me/62xxxx?text=...` [fase 2].

---

## 11. Tahapan pengerjaan

| Fase | Isi | Hasil |
|---|---|---|
| **0. Persiapan** | Repo, Vite + React/Svelte + TS, Tailwind, Dexie, vite-plugin-pwa, ESLint/Prettier, Vitest, Playwright; seed menu (Bagian 2.4); pilih backend | Aplikasi kosong bisa dipasang & dibuka offline |
| **1. MVP Kasir lokal** | Grid menu, cari, kategori, varian, keranjang, bayar tunai/QRIS, struk layar + bagikan, riwayat, void (alasan + konfirmasi, tanpa PIN), nomor struk, indikator online/offline, ekspor cadangan. Belum ada sinkron, pengguna/PIN, shift; tabel outbox sudah ditulis sejak awal agar fase 2 tinggal menyambung | Bisa dipakai jualan sehari-hari tanpa server |
| **2. Sinkron & manajemen dasar** | Backend + skema + aturan akses, outbox push/pull, pengguna & PIN, buka/tutup shift, pengeluaran & kas masuk/keluar, kelola menu & harga, laporan harian/per menu/per jam, ekspor CSV, open bill [TANYA] | Data aman di server, pemilik bisa mengatur menu & melihat laporan |
| **3. Printer** | `PrinterService`, bungkus Capacitor (Android), cetak ESC/POS, cetak otomatis, laporan shift tercetak | Struk thermal tercetak |
| **4. Lanjutan** | Stok bahan & resep, HPP/laba, diskon/promo, harga per kanal (ShopeeFood), dashboard web pemilik, foto nota, refund sebagian | Manajemen lengkap |

### 11.1 Kriteria selesai MVP (fase 1, uji wajib)
- [ ] Mode pesawat: aplikasi terbuka dari layar utama dan transaksi bisa dibuat.
- [ ] HP dimatikan paksa setelah bayar: transaksi masih ada saat dibuka lagi.
- [ ] Harga diubah: transaksi lama tetap memakai harga lama.
- [ ] Total, kembalian, dan rekap harian cocok dengan hitungan manual.
- [ ] Ekspor lalu impor cadangan mengembalikan semua transaksi.
- [ ] Tampilan nyaman di layar 360×640 sampai 412×915.

### 11.2 Kriteria selesai fase 2 (uji wajib)
- [ ] 50 transaksi offline, lalu online: semua terkirim tepat sekali (tidak dobel).
- [ ] Sinkron terputus di tengah batch, lalu dicoba lagi: tidak ada duplikat atau data hilang.
- [ ] Void setelah tersinkron: status di server ikut berubah.
- [ ] Void tanpa PIN pemilik ditolak; kas seharusnya shift cocok dengan hitungan manual.
- [ ] Jam HP sengaja dimajukan/dimundurkan: perubahan menu dari dashboard tetap sampai ke HP.

---

## 12. Pertanyaan terbuka & asumsi

### 12.1 Pertanyaan untuk Fajar
| # | Pertanyaan | Dampak |
|---|---|---|
| 1 | React atau Svelte? | Struktur kode |
| 2 | Backend: Supabase atau PocketBase? | Fase 2, biaya, hosting |
| 3 | Metode bayar apa saja: Tunai, QRIS (bank/penyedia apa), Transfer, e-wallet? | Layar bayar, laporan |
| 4 | Apakah sudah ada printer struk? Merek/tipe, 58 atau 80 mm, Bluetooth? | Fase 3 |
| 5 | Apakah ada pajak (PB1 10%) atau service charge? Termasuk harga atau ditambahkan? | Rumus total, struk |
| 6 | Pesanan ShopeeFood dicatat di kasir ini? Harganya beda? | Harga per kanal, laporan |
| 7 | Perlu open bill (pesan dulu, bayar belakangan per meja)? | Fase 2 |
| 8 | Perlu tiket dapur terpisah? | Cetak |
| 9 | Ada topping/tambahan berbayar (extra telur, extra nasi)? | Modifier |
| 10 | Indomie Telur juga ada pilihan goreng/kuah? Lalapan sudah termasuk nasi? | Varian menu |
| 11 | Berapa kasir dan shift per hari? Jam buka? | Shift, laporan per jam |
| 12 | Stok mau dilacak sampai bahan baku (resep) atau cukup produk jadi tertentu? | Fase 4 |
| 13 | Ada diskon/promo rutin (paket, happy hour, member)? | Fase 4 |
| 14 | Pemilik ingin melihat laporan dari HP lain/laptop (dashboard web)? | Fase 4 |
| 15 | HP kasir punya paket data seluler sebagai cadangan saat WiFi mati? | Sinkron saat listrik mati |
| 16 | Pembulatan total (mis. ke Rp 500)? | Rumus total |
| 17 | Domain/hosting untuk PWA (Netlify, Vercel, Cloudflare Pages)? | Fase 0 |

### 12.2 Asumsi yang dipakai sampai dijawab
- Satu toko, satu HP kasir, zona waktu WIB.
- Harga di menu **sudah final** dan **belum termasuk pajak**; pajak & service **nonaktif**.
- Metode bayar: Tunai, QRIS statis, Transfer.
- Printer 58 mm Bluetooth ESC/POS (bila ada).
- Varian minuman panas/es = produk terpisah (sesuai menu).
- Void butuh PIN pemilik (mulai fase 2; fase 1 cukup konfirmasi + alasan); item & pembayaran tidak bisa diedit setelah lunas.
- Transaksi butuh shift aktif (mulai fase 2).
- Data lama > 90 hari yang sudah sinkron boleh dipangkas dari HP.

---

## 13. Panduan untuk Claude Code

Tempel bagian ini ke `CLAUDE.md` di repo saat mulai.

```markdown
# Kasir Wedangan Arjuna — aturan proyek
- Spesifikasi lengkap: SPESIFIKASI-KASIR-ARJUNA.md di root repo (baca dulu; pindahkan ke docs/ bila perlu dan sesuaikan baris ini).
- Kerjakan per fase (Bagian 11). Fase 1 = kasir lokal tanpa sinkron/PIN/shift.
- Bahasa UI: Indonesia. Kode, nama tabel & variabel: Inggris.
- Offline-first: UI hanya baca/tulis Dexie. Jangan pernah menunggu jaringan di alur kasir.
- Setiap perubahan data = 1 transaksi Dexie yang menulis baris data + entri outbox.
- ID: UUID v7 dibuat di klien. Upsert di server idempoten berdasarkan id.
- Uang: integer Rupiah. Jangan pakai float. Format tampilan: Intl.NumberFormat('id-ID').
- Waktu: simpan ISO UTC, tampilkan Asia/Jakarta.
- Transaksi lunas bersifat immutable; koreksi lewat void/refund.
- order_items menyimpan snapshot nama & harga.
- Backend lewat interface SyncAdapter (Supabase/PocketBase); printer lewat PrinterService.
- Wajib uji: Vitest untuk rumus total/kembalian/shift; Playwright untuk alur bayar dalam mode offline.
- Mobile-first, target layar 360–412 px, tombol min 44 px.
```

Struktur folder yang disarankan:
```
src/
  app/            routing, layout, navigasi bawah
  features/
    pos/          grid menu, keranjang, pembayaran, struk
    history/      riwayat, void
    shift/        buka/tutup shift, kas masuk/keluar
    expenses/
    reports/
    menu-admin/
    stock/
    users/
    settings/
  data/
    db.ts         skema Dexie
    repos/        akses data per entitas (tulis + outbox)
    seed/menu.json
  sync/           SyncEngine, adapters/supabase.ts, adapters/pocketbase.ts
  print/          PrinterService, escpos.ts, adapters/
  lib/            money.ts, time.ts, id.ts, receipt-text.ts
SPESIFIKASI-KASIR-ARJUNA.md
```

---

## 14. Lampiran

### 14.1 Prototipe referensi
Prototipe PWA sederhana (HTML + JS murni, tanpa framework) sudah dibuat dan diuji, sebagai **referensi perilaku saja**, bukan dasar kode:
`/mnt/project-files/kasir-arjuna/` (zip: `/mnt/project-files/kasir-arjuna.zip`). **Catatan:** lokasi ini ada di lingkungan pembuat dokumen dan **tidak ada di repo ini**; salin foldernya ke repo (mis. `reference/prototype/`) bila ingin dipakai Claude Code.
Isinya: grid menu, keranjang, bayar tunai/QRIS, struk, riwayat & void, rekap harian, indikator offline, outbox sinkron, service worker, dan contoh server Google Apps Script.

### 14.2 Glosarium
| Istilah | Arti |
|---|---|
| Offline-first | Aplikasi bekerja penuh tanpa internet; server hanya tempat salinan |
| PWA | Progressive Web App: situs web yang bisa dipasang & dibuka offline |
| IndexedDB / Dexie | Database di dalam browser / library untuk memakainya |
| Outbox | Antrean perubahan lokal yang belum terkirim ke server |
| Idempoten | Dikirim berkali-kali hasilnya tetap sama (tidak dobel) |
| Void | Pembatalan transaksi penuh |
| Shift / tutup kasir | Periode kerja kasir dengan hitung uang awal & akhir |
| ESC/POS | Bahasa perintah standar printer thermal |
| Capacitor | Alat membungkus aplikasi web menjadi aplikasi Android |
| RLS | Row Level Security, aturan akses per baris di Postgres/Supabase |
| HPP | Harga Pokok Penjualan (modal bahan per porsi) |
