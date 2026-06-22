# FacultyWare — Sistem Informasi Pengadaan Barang Fakultas (B09)

## Deskripsi Aplikasi

**FacultyWare** adalah aplikasi web untuk mengelola **transaksi pengadaan barang fakultas**, mulai dari permintaan hingga penerimaan barang. Alurnya:

> Permintaan Pengadaan → Persetujuan Wakil Dekan → Konsolidasi Pengadaan → Purchase Order → Persetujuan Belanja (PO) → **Penerimaan Barang**

Aplikasi memiliki **dua peran** (Admin operasional & Wakil Dekan penyetuju) dengan **dua gerbang persetujuan** (saat permintaan diajukan, dan saat belanja/PO disetujui dengan mempertimbangkan harga). Hak akses tiap fitur diatur lewat **RBAC/ACL**.

**Teknologi:** Express.js (Node.js) · MySQL (native `mysql2`, tanpa ORM) · EJS + Basecoat UI · Chart.js.

Proyek ini adalah **Tugas Besar Pemrograman Web** kelompok **B09**.

---

## Pembagian Tugas Anggota

| Anggota | Modul Utama |
|---|---|
| **Mikail Samyth Habibillah** | Penerimaan Barang |
| **Nadila Laila** | Permintaan + Pengadaan |
| **Mutiara Yudya** | Purchase Order + Supplier |
| **Ghezy** | Persetujuan (Wakil Dekan) + Dashboard |

### Rincian Fitur

| No | Penanggung Jawab | Fitur | Jenis | ACL |
|---|---|---|---|---|
| 1 | Mikail Samyth Habibillah | Daftar penerimaan (search + pagination + sort) | Utama | `manage_receiving` |
| 2 | Mikail Samyth Habibillah | Verifikasi penerimaan + upload bukti multi-file | Utama | `manage_receiving` |
| 3 | Mikail Samyth Habibillah | Catat retur barang ke vendor | Utama | `manage_receiving` |
| 4 | Mikail Samyth Habibillah | Catat barang ganti + konfirmasi final (catat ke buku besar) | Utama | `manage_receiving` |
| 5 | Mikail Samyth Habibillah | Export laporan penerimaan PDF (`/receiving/:id/export`) | Dokumen | `manage_receiving` |
| 6 | Mikail Samyth Habibillah | `GET /api/receiving` (JSON + pagination) | RestAPI | `manage_receiving` |
| 7 | Nadila Laila | CRUD Permintaan Barang (buat/daftar/detail/hapus) | Utama | `manage_procurement` |
| 8 | Nadila Laila | Ajukan/submit permintaan | Utama | `manage_procurement` |
| 9 | Nadila Laila | Konsolidasi Pengadaan (gabung permintaan → pengadaan) | Utama | `manage_procurement` |
| 10 | Nadila Laila | Daftar & detail Pengadaan (search + pagination + sort) | Utama | `manage_procurement` |
| 11 | Nadila Laila | Export permintaan PDF (`/procurement/:id/export`) | Dokumen | `manage_procurement` |
| 12 | Nadila Laila | `GET /pengadaan/api/request/:requestNumber/items` | RestAPI | `manage_procurement` |
| 13 | Mutiara Yudya | CRUD Master Supplier | Utama | `manage_vendor` |
| 14 | Mutiara Yudya | Buat Purchase Order dari pengadaan | Utama | `manage_po` |
| 15 | Mutiara Yudya | Daftar PO (search + pagination + sort) | Utama | `manage_po` |
| 16 | Mutiara Yudya | Detail PO + ubah status | Utama | `manage_po` |
| 17 | Mutiara Yudya | Export formulir PO PDF (`/purchase/:id/export`) | Dokumen | `manage_po` |
| 18 | Mutiara Yudya | `GET /purchase/api/list` (JSON + pagination) | RestAPI | `manage_po` |
| 19 | Ghezy | Inbox persetujuan permintaan | Utama | `manage_approval` |
| 20 | Ghezy | Setujui / tolak permintaan + catatan | Utama | `manage_approval` |
| 21 | Ghezy | Persetujuan Belanja (PO) + arsip | Utama | `manage_approval` |
| 22 | Ghezy | Riwayat persetujuan & dashboard ringkasan | Utama | `manage_approval` |
| 23 | Ghezy | Export rekap persetujuan (`/approval/rekap/export`) | Dokumen | `manage_approval` |
| 24 | Ghezy | `GET /api/dashboard/stats` (statistik dashboard, JSON) | RestAPI | `isAuthenticated` (login; data disaring per-peran) |

---

## Cara Instalasi dan Menjalankan Aplikasi

### Prasyarat
- **Node.js** v18 atau lebih baru (beserta `npm`).
- **MySQL/MariaDB** berjalan di lokal (paling mudah lewat **XAMPP** → nyalakan modul **MySQL**).
- Secara default proyek menyambung ke `localhost:3306`, user `root`, tanpa password (bawaan XAMPP).

> **Pengguna Dolibarr/DoliWamp:** MariaDB Dolibarr sering merebut port 3306 sehingga MySQL XAMPP tidak jalan & aplikasi gagal konek. Pastikan MySQL XAMPP yang memegang port 3306.

### 1. Ambil kode
```bash
git clone https://github.com/samythh/facultyware-pweb.git
cd facultyware-pweb
git checkout dev
```
Jika sudah pernah clone, cukup perbarui: `git checkout dev && git pull`.

### 2. Install dependensi
```bash
npm install
npx playwright install chromium   # hanya bila ingin menjalankan test
```

### 3. Buat file `.env`
`.env` tidak ikut di Git. Buat di root proyek:
```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=
DB_NAME=facultyware

PORT=3000
SESSION_SECRET=facultyware-dev-secret

# Dev only: lewati SEMUA pengecekan auth (login + permission) untuk preview cepat.
# Pakai 0 untuk menguji hak akses sesungguhnya.
DEV_NO_AUTH=0
```
> Jika MySQL Anda memakai password atau port lain, sesuaikan `DB_PASSWORD` dan tambahkan `DB_PORT=...` bila perlu.

### 4. Siapkan database
Database lengkap (struktur **dan** data, termasuk skema dosen + migrasi + seed + akun login) tersedia sebagai satu berkas dump di [`database/facultyware.sql`](database/facultyware.sql). Cukup impor berkas itu.

> ⚠️ Impor ini **menghapus lalu membuat ulang** database `facultyware` (`DROP`/`CREATE DATABASE` ada di dalam dump).

**Cara A — command line:**
```bash
mysql -u root facultyware < database/facultyware.sql
# atau panggil mysql bawaan XAMPP (sesuaikan path):
"C:\xampp\mysql\bin\mysql.exe" -u root < database/facultyware.sql
```

**Cara B — phpMyAdmin:** buka `http://localhost/phpmyadmin` → menu **Import** → pilih `database/facultyware.sql` → **Go**.

### 5. Jalankan aplikasi
```bash
npm run dev     # mode dev (auto-reload via nodemon)
# atau
npm start       # mode biasa
```
Buka **http://localhost:3000**.

### Akun untuk login (sudah ada di dalam dump)
| Peran | Email | Password |
|---|---|---|
| Admin | `admin@unand.ac.id` | `admin123` |
| Wakil Dekan | `wadek@unand.ac.id` | `wadek123` |

> Login memakai **email**, bukan username. Admin bisa Pengadaan/PO/Penerimaan; Wakil Dekan hanya Persetujuan (modul di luar haknya menjawab 403).

---

## Struktur Singkat
| Folder / Berkas | Isi |
|---|---|
| `routes/` | Route Express per modul (purchase, approval, receiving, dll.) |
| `controllers/` | Logika controller |
| `views/` | Template EJS (tampilan) |
| `middlewares/acl.js` | Pengecekan permission (RBAC) |
| `lib/db.js` | Koneksi MySQL (pool `mysql2`) |
| `database/facultyware.sql` | Dump database lengkap untuk reproduksi |
| `public/` | Aset statis & folder upload bukti penerimaan |
| `tests/e2e/` | Pengujian end-to-end (Playwright) |

---

## Testing
Pengujian end-to-end memakai **Playwright** (1 browser: Chromium):
```bash
npx playwright test            # jalankan semua test
npx playwright test --headed   # dengan browser terlihat
npx playwright show-report     # lihat laporan hasil test
```

---

## Deployment (Produksi)
Aplikasi di-deploy ke **GCP Cloud Run** + **Cloud SQL (MySQL 8.4)**, container Docker (`node:20-alpine`), auto-deploy via Cloud Build saat push ke `main`. Panduan lengkap: [DEPLOYMENT-GCP.md](DEPLOYMENT-GCP.md).

---

## Catatan Penting
- **Jangan commit `.env`.**
- Berkas hasil upload di `public/assets/uploads/` adalah data runtime — tidak perlu di-commit.
- Setelah menambah perubahan skema/seed yang ingin dibagikan ke tim, **perbarui dump** agar tetap sinkron:
  ```bash
  "C:\xampp\mysql\bin\mysqldump.exe" -u root --databases facultyware \
    --default-character-set=utf8mb4 --add-drop-database \
    --result-file=database/facultyware.sql
  ```
