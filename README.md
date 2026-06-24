# SIMPEL (Sistem Informasi Manajemen Peminjaman Peralatan)

Aplikasi berbasis web yang digunakan untuk mengelola proses peminjaman peralatan di lingkungan fakultas. Sistem ini memungkinkan pengguna mengajukan peminjaman peralatan, memantau status peminjaman, mencetak surat peminjaman, serta membantu Penanggung Jawab (PJ) Peralatan dalam mengelola seluruh proses peminjaman.

## Fitur Utama

### Fitur Pengguna

- Melihat dashboard pengajuan peminjaman
- Menambah pengajuan peminjaman peralatan
- Mengubah data pengajuan peminjaman
- Membatalkan pengajuan peminjaman
- Mengunduh surat peminjaman dalam format PDF
- Melacak status peminjaman melalui API

### Fitur Penanggung Jawab (PJ) Peralatan

- Melihat daftar pengajuan peminjaman
- Menyetujui pengajuan peminjaman
- Menolak pengajuan peminjaman
- Mengubah status peminjaman setelah peralatan dikembalikan
- Melihat daftar peminjaman yang sedang berlangsung
- Melihat riwayat peminjaman
- Mencari data riwayat peminjaman
- Memfilter riwayat peminjaman berdasarkan status atau tanggal
- Melihat detail data peminjaman
- Mengekspor laporan dalam format PDF dan CSV
- Melihat preview laporan sebelum diekspor

### API

- API jumlah seluruh peminjaman
- API jumlah peminjaman yang menunggu persetujuan
- API jumlah peminjaman yang belum dikembalikan
- API pelacakan status peminjaman

## Prasyarat

Pastikan perangkat telah terinstal:

- Node.js versi 18 atau lebih baru
- MySQL Server
- npm (Node Package Manager)

## Instalasi

Install seluruh dependency:

```bash
npm install
```

## Konfigurasi Environment

Buat file `.env` pada root project:

```env
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=facultyware

SESSION_SECRET=your_secret_key
```

Sesuaikan konfigurasi tersebut dengan database yang digunakan.

## Menjalankan Aplikasi

Mode Production:

```bash
npm start
```

Mode Development:

```bash
npm run dev
```

Entrypoint aplikasi berada pada `bin/www`, dan Express dikonfigurasi pada `app.js`.

## Pengujian

Menjalankan pengujian Playwright:

```bash
npx playwright test
```

Menampilkan laporan hasil pengujian:

```bash
npx playwright show-report
```

## Struktur Proyek

```text
app.js                 -> Konfigurasi aplikasi Express
bin/www                -> Entrypoint server
controllers/           -> Logika bisnis aplikasi
routes/                -> Routing aplikasi
middlewares/           -> Middleware autentikasi dan ACL
views/                 -> Template EJS
public/                -> File statis (CSS, JavaScript, gambar)
lib/db.js              -> Koneksi database
test/                  -> Unit testing
tests/e2e/             -> Pengujian End-to-End menggunakan Playwright
```

## Rute Aplikasi

### Web Routes

| Route | Deskripsi |
|---------|---------|
| / | Halaman utama |
| /login | Halaman login |
| /logout | Logout pengguna |
| /users | Daftar pengguna |
| /equipment-loans | Halaman peminjaman peralatan |
| /manager | Dashboard Penanggung Jawab Peralatan |

### API Routes

| Endpoint | Fungsi |
|-----------|---------|
| GET /api/manager/loans/total | Mendapatkan jumlah seluruh peminjaman |
| GET /api/manager/loans/requested | Mendapatkan jumlah peminjaman yang menunggu persetujuan |
| GET /api/manager/loans/unreturned | Mendapatkan jumlah peminjaman yang belum dikembalikan |
| GET /api/equipment-loans/track/:id | Melacak status peminjaman berdasarkan ID |

Seluruh endpoint API memerlukan autentikasi pengguna.

## Pembagian Tugas Anggota

| Nama | NIM | Tanggung Jawab |
|------|------|------|
| Wanda Fitriardi | 2411521004 | Dashboard Pengguna, Tambah Pengajuan Peminjaman, Edit Pengajuan Peminjaman, Batalkan Pengajuan Peminjaman, Export Surat Peminjaman PDF, API Pelacakan Status Peminjaman |
| Fadel A. Rahman | 2411522017 | Persetujuan dan Penolakan Peminjaman, Update Status Pengembalian, Peminjaman Berlangsung, Riwayat Peminjaman, Export Data Status Peminjaman, API Jumlah Peminjaman Menunggu Persetujuan |
| Ahmad Zuhdi Filanda | 2411522018 | Detail Data Peminjaman, Pencarian Riwayat Peminjaman, Filter Riwayat Berdasarkan Status atau Tanggal, Export Laporan Riwayat PDF, Preview Laporan, API Jumlah Seluruh Peminjaman, API Jumlah Peminjaman Belum Dikembalikan |

## Catatan

- Session pengguna disimpan pada MySQL menggunakan `express-mysql-session`.
- Database dan tabel yang dibutuhkan harus tersedia sebelum aplikasi dijalankan.
- Sesuaikan konfigurasi pada file `.env` dengan lingkungan pengembangan atau server yang digunakan.

## Lisensi

Proyek ini dikembangkan untuk memenuhi tugas mata kuliah Pemrograman Web Program Studi Sistem Informasi Universitas Andalas.