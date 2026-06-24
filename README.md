# FacultyWare — Sistem Perjalanan Dinas Fakultas

FacultyWare adalah aplikasi web berbasis Node.js, Express.js, MySQL, dan EJS yang dirancang untuk mengelola permohonan perjalanan dinas fakultas secara efisien dan transparan. Aplikasi ini memiliki alur kerja lengkap mulai dari pengajuan perjalanan dinas, manajemen jadwal (itinerary), anggota perjalanan, unggah berkas surat tugas, penulisan laporan hasil perjalanan (outcome), hingga pengajuan reimburse biaya perjalanan dinas.

---

## 1. Tech Stack

*   **Backend**: Node.js & Express.js
*   **Database**: MySQL (menggunakan query SQL mentah melalui driver `mysql2` tanpa ORM)
*   **View Engine**: EJS (Embedded JavaScript templates)
*   **Styling**: Tailwind CSS & Basecoat UI Library
*   **Interaktivitas**: Vanilla JavaScript & HTMX (untuk pembaruan parsial dinamis)
*   **Autentikasi & Sesi**: `express-session` & `express-mysql-session`
*   **Keamanan**: Enkripsi password menggunakan `bcryptjs`
*   **Unggah Berkas**: `multer`
*   **Ekspor Dokumen**: PDFKit (PDF) & SheetJS/xlsx (Excel)

---

## 2. Cara Instalasi & Konfigurasi

### Langkah 1: Kloning & Install Dependencies
Pastikan Node.js dan npm telah terinstal di komputer Anda. Jalankan perintah berikut di terminal:
```bash
npm install
```

### Langkah 2: Konfigurasi Environment Variables (`.env`)
Salin file `.env.example` menjadi `.env` di direktori utama:
```bash
cp .env.example .env
```
Sesuaikan konfigurasi database sesuai dengan server MySQL lokal Anda:
```env
PORT=3000
DB_HOST=127.0.0.1
DB_USER=root
DB_PASSWORD=
DB_NAME=tb_b5
DB_PORT=3306
SESSION_SECRET=facultyware_secret
```

### Langkah 3: Inisialisasi Database
Buat database baru di server MySQL Anda dengan nama sesuai konfigurasi `.env` (misal: `tb_b5`). Impor file dump SQL database Anda ke dalamnya.

Jalankan script inisialisasi lokal untuk membuat tabel relasi pendukung perjalanan dinas jika belum tersedia:
```bash
node scripts/create_local_tables.js
```

---

## 3. Cara Menjalankan Aplikasi

### Mode Pengembangan (Development)
Untuk menjalankan server dengan auto-reload menggunakan `nodemon`:
```bash
npm run dev
```
Aplikasi akan aktif di alamat: [http://localhost:3000](http://localhost:3000).

### Mode Produksi (Production)
Untuk menjalankan aplikasi dalam mode produksi:
```bash
npm start
```

### Pengujian E2E (Playwright)
Untuk menjalankan pengetesan E2E otomatis:
```bash
# Jalankan seluruh rangkaian test suite
npx playwright test --project=chromium

# Jalankan test suite dengan UI interaktif
npx playwright test --ui
```

---

## 4. Akun Demo & Peran (Role)

Aplikasi memiliki dua jenis peran (role) utama untuk masuk ke sistem:

### Pegawai
*   **Username**: `pegawai`
*   **Password**: `password`
*   **Fitur**: Input/CRUD perjalanan dinas, kelola itinerary/dokumen/anggota, unggah laporan hasil perjalanan, pengajuan reimburse, ekspor/impor Excel, dan unduh PDF Surat Tugas.

### Pimpinan
*   **Username**: `pimpinan`
*   **Password**: `password`
*   **Fitur**: Dashboard pemantauan statistik, persetujuan (Approve/Reject) perjalanan dinas & klaim reimburse pegawai, peninjauan laporan, dan ekspor Excel global.

---

## Pembagian Tugas Anggota

### 1. Vanesa Gociardi

**Modul Perjalanan Dinas Pegawai**

* Pengembangan fitur pengajuan perjalanan dinas.
* Pengelolaan data perjalanan dinas pegawai.
* Menampilkan status pengajuan perjalanan.
* Pengelolaan hasil perjalanan dan rencana tindak lanjut.
* Integrasi modul pegawai dengan database.
* Deployment aplikasi dan dokumentasi proyek.

### 2. Farrah Aulia

**Modul Reimburse Perjalanan Dinas**

* Pengembangan fitur pengajuan reimburse.
* Pengelolaan komponen biaya perjalanan.
* Upload bukti pembayaran dan kwitansi.
* Pengelolaan data pengeluaran perjalanan dinas.
* Export data reimburse.

### 3. Fadel

**Modul Dokumen, Itinerary, dan Anggota Perjalanan**

* Pengelolaan itinerary perjalanan dinas.
* Pengelolaan anggota/delegasi perjalanan.
* Upload dan manajemen dokumen pendukung.
* Integrasi dokumen dengan data perjalanan dinas.
* Validasi data perjalanan.

### 4. Zaki

**Modul Persetujuan dan Dashboard Pimpinan**

* Pengembangan dashboard pimpinan.
* Persetujuan (Approve/Reject) perjalanan dinas.
* Persetujuan pengajuan reimburse.
* Monitoring seluruh data perjalanan dinas.
* Rekapitulasi dan pelaporan data perjalanan.
