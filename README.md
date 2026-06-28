# SPR FTI — Sistem Peminjaman Ruangan Fakultas Teknologi Informasi

Sistem Peminjaman Ruangan (SPR) FTI adalah aplikasi web berbasis Node.js (Express) untuk membantu mengelola ketersediaan, peminjaman, serta penjadwalan ruangan di lingkungan Fakultas Teknologi Informasi Universitas Andalas secara terstruktur, real-time, dan aman.

Aplikasi ini menggunakan **Basecoat UI** untuk estetika layout modern bertema gelap/terang (ala shadcn/ui) dan **FullCalendar** untuk interaksi jadwal real-time.

---

## 🛠️ Spesifikasi Teknologi & Stack

* **Backend:** Express.js (Node.js)
* **Database:** MySQL / MariaDB (Tanpa ORM, menggunakan raw SQL via library `mysql2`)
* **Frontend:** EJS (Templating), Tailwind CSS (via Basecoat UI), Vanilla JS, HTMX (untuk pembaruan parsial)
* **Session & Auth:** `express-session` & `bcryptjs` untuk enkripsi password

---

## 🚀 Panduan Instalasi dan Menjalankan Proyek

### 1. Prasyarat
Pastikan Anda sudah menginstal perangkat lunak berikut di perangkat Anda:
* **Node.js** (v18 atau lebih baru)
* **MySQL** atau **MariaDB**

### 2. Kloning Proyek
Buka terminal dan kloning repositori proyek ini:
```bash
git clone https://github.com/username/facultyware.git
cd facultyware
```

### 3. Konfigurasi Environment (`.env`)
Buat berkas bernama `.env` pada root direktori proyek dan konfigurasikan dengan kredensial database Anda:
```env
DB_HOST=localhost
DB_USER=root
DB_PASS=password_mysql_anda
DB_NAME=facultywarefix

PORT=3000
```

### 4. Instalasi Dependensi
Instal modul Node.js yang diperlukan proyek:
```bash
npm install
```

### 5. Inisialisasi Database & Seeding
Jalankan skrip seeder untuk membuat tabel database serta mengisi data awal secara otomatis (termasuk akun uji coba):
```bash
node scripts/seed.js
```

### 6. Menjalankan Aplikasi
* **Mode Pengembangan (dengan Auto-Reload):**
  ```bash
  npm run dev
  ```
  Aplikasi akan berjalan di `http://localhost:3000`.

* **Mode Produksi:**
  ```bash
  npm start
  ```

---

## 🔑 Akun Uji Coba (Testing Accounts)

Setelah melakukan seeding database, Anda dapat login menggunakan akun-akun berikut:

| Email | Password | Peran (Role) | Keterangan |
| :--- | :--- | :--- | :--- |
| `pengguna1@unand.ac.id` | `password123` | pengguna | Mahasiswa (Rafa Ardian) |
| `pengguna2@unand.ac.id` | `password123` | pengguna | Mahasiswa (Fuad Maulana) |
| `pj1@unand.ac.id` | `password123` | penanggung_jawab | Admin Penanggung Jawab DSI |
| `pj2@unand.ac.id` | `password123` | penanggung_jawab | Admin Penanggung Jawab Tekkom |

---

## 👥 Pembagian Tugas Anggota Kelompok

Proyek ini dikembangkan secara kolaboratif dengan pembagian kontribusi fitur utama sebagai berikut:

### 1. Rafa Ardian (2210953001)
* **Fitur Utama:**
  * Implementasi Modul Pengajuan Peminjaman Ruangan (Mahasiswa).
  * Pembuatan Halaman Riwayat Peminjaman Pribadi beserta fitur Pembatalan Pengajuan.
  * Fitur Ekspor Riwayat Peminjaman dengan Filter status dan rentang tanggal.
  * Pembuatan REST API untuk daftar peminjaman.
* **Kontribusi Tambahan:**
  * Setup struktur routing dasar Express dan koneksi modul `mysql2`.

### 2. Fuad Maulana (2210951042)
* **Fitur Utama:**
  * Implementasi Halaman Dashboard (Admin Penanggung Jawab & Pengguna biasa).
  * Fitur Manajemen Peminjaman (Verifikasi ACC/Tolak, Edit, dan Hapus Pengajuan).
  * Pembuatan Modul Rekapitulasi Laporan Bulanan.
  * Pembuatan REST API untuk daftar ruangan.
* **Kontribusi Tambahan:**
  * Desain antarmuka UI Basecoat (integrasi dark/light mode) dan modul digital clock.
