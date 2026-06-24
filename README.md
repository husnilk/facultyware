# FacultyWare — Survey Module (Kelompok A13)

Sistem pengisian survei internal Fakultas Teknologi Informasi (FTI). Aplikasi ini ditujukan khusus untuk civitas akademika yang telah terdaftar di sistem untuk memberikan umpan balik (feedback) secara internal, dan dilengkapi dengan panel admin untuk rekapitulasi, statistik, cetak PDF, ekspor CSV, serta REST API.

---

## Spesifikasi Teknologi
- **Backend**: Express.js (Node.js)
- **Database**: MySQL dengan `mysql2` (Raw Query, tanpa ORM)
- **Frontend / Styling**: Basecoat UI & Tailwind CSS
- **Interaktivitas**: HTMX & Vanilla JavaScript
- **Session & Auth**: `express-session` & `bcryptjs` untuk hash password
- **Generate PDF**: `pdfkit` untuk export laporan PDF langsung download

---

## Pembagian Tugas & Detail Fitur

### 👩‍💻 Fitur Arifah (6 Fitur Utama & API)

1. **Lihat Daftar Survey (Respondent)**
   - **Endpoint**: `GET /survey`
   - **Deskripsi**: Menampilkan semua survei aktif (`is_active = 1`). Dilengkapi dengan pencarian judul/deskripsi, pagination (10 data per halaman), serta indikator badge "Sudah Diisi" jika responden telah mengisi survei tersebut.
   - **ACL**: Hanya untuk role `respondent`.

2. **Validasi PIN + Isi + Submit Survey (Respondent)**
   - **Endpoint**: 
     - `GET /survey/:id` (Form Input PIN)
     - `POST /survey/:id/pin` (Validasi PIN)
     - `GET /survey/:id/fill` (Form Kuesioner)
     - `POST /survey/:id/submit` (Submit Jawaban)
   - **Deskripsi**: Memvalidasi PIN unik (harus sesuai dengan survei, email user, dan belum pernah digunakan). Mendukung 3 tipe pertanyaan: *single choice* (radio button), *multiple choice* (checkbox), dan *short answer* (textarea). Menyediakan validasi server dan validasi client-side untuk memastikan semua pertanyaan wajib diisi.
   - **ACL**: Hanya untuk role `respondent`.

3. **Rekap Detail Jawaban Per Responden (Admin)**
   - **Endpoint**: `GET /admin/survey/rekap` & `GET /admin/survey/rekap/:id`
   - **Deskripsi**: Halaman untuk melihat detail nama, email, dan waktu pengisian dari responden yang telah mengisi survei tertentu. Dilengkapi fitur pencarian nama/email dan pagination.
   - **ACL**: Hanya untuk role `admin`.

4. **Statistik Jawaban Per Pertanyaan (Admin)**
   - **Endpoint**: `GET /admin/survey/statistik` & `GET /admin/survey/statistik/:id`
   - **Deskripsi**: Menampilkan persentase jawaban per pertanyaan dalam bentuk visual *progress bar* (untuk pilihan ganda) dan daftar teks (untuk jawaban esai/singkat). Halaman list dilengkapi pencarian dan pagination.
   - **ACL**: Hanya untuk role `admin`.

5. **Export CSV Data Mentah (Admin)**
   - **Endpoint**: `GET /admin/survey/export/:id`
   - **Deskripsi**: Mengunduh data respons mentah ke dalam format CSV dengan BOM UTF-8 (agar format karakter bahasa Indonesia terbaca dengan benar di Excel). Jika data kosong, sistem memberikan pesan error informatif di client.
   - **ACL**: Hanya untuk role `admin`.

6. **REST API GET List Survey + Pertanyaan (REST API)**
   - **Endpoint**: `GET /api/surveys`
   - **Deskripsi**: Menghasilkan respon JSON berisi daftar survei aktif lengkap beserta pertanyaan dan pilihan jawabannya.
   - **ACL**: Butuh login (`isAuthenticated`), dapat diakses admin & respondent.

---

### 👩‍💻 Fitur Aqila (6 Fitur Utama & API)

1. **Dashboard Survey (Admin)**
   - **Endpoint**: `GET /admin/responden`
   - **Deskripsi**: Menampilkan daftar seluruh survei di database beserta jumlah responden dan status keaktifan survei. Dilengkapi fitur pencarian, pagination, dan tombol aksi cepat (Responden, Riwayat, PDF, Toggle Aktif).
   - **ACL**: Hanya untuk role `admin`.

2. **Daftar Responden Per Survey (Admin)**
   - **Endpoint**: `GET /admin/responden/:id`
   - **Deskripsi**: Menampilkan informasi detail nama, email, nomor HP, dan waktu pengisian khusus untuk survei yang dipilih. Dilengkapi fitur pencarian dan pagination.
   - **ACL**: Hanya untuk role `admin`.

3. **Toggle Aktif/Nonaktif Survey (Admin)**
   - **Endpoint**: `POST /admin/responden/:id/toggle`
   - **Deskripsi**: Mengubah status keaktifan survei (`is_active` antara 0 atau 1) dengan aman menggunakan method POST.
   - **ACL**: Hanya untuk role `admin`.

4. **Riwayat Pengisian Per Survey (Admin)**
   - **Endpoint**: `GET /admin/responden/:id/riwayat`
   - **Deskripsi**: Menampilkan log riwayat pengisian berupa nama, email, jumlah pertanyaan yang dijawab, serta waktu pengisian.
   - **ACL**: Hanya untuk role `admin`.

5. **Export PDF Laporan Ringkasan (Admin)**
   - **Endpoint**: `GET /admin/responden/:id/pdf`
   - **Deskripsi**: Menghasilkan file PDF laporan ringkasan yang langsung dapat didownload menggunakan `pdfkit`. Berisi judul survey, total responden, statistik jawaban per pertanyaan (tabel untuk pilihan ganda, list untuk jawaban teks). Jika survei belum memiliki responden, akan diredirect kembali ke dashboard dengan pesan error informatif.
   - **ACL**: Hanya untuk role `admin`.

6. **REST API GET Rekap Jawaban Per Survey (REST API)**
   - **Endpoint**: `GET /api/surveys/:id/rekap`
   - **Deskripsi**: Menghasilkan respon JSON berisi ringkasan data kuesioner, jumlah responden, daftar pertanyaan, serta persentase pilihan jawaban.
   - **ACL**: Butuh login (`isAuthenticated`).

---

## Alur Sistem

```
RESPONDENT (Mahasiswa/Civitas):
Login ──> Lihat Daftar Survey Aktif ──> Pilih Survey ──> Masukkan PIN ──> Validasi PIN ──> Isi Kuesioner ──> Submit

ADMIN (Staf/Fakultas):
Login ──> Kelola Dashboard Survey (Toggle Aktif) ──> Lihat Rekap / Statistik / Riwayat ──> Export CSV / Download PDF
```

---

## Struktur Project

```
facultyware/
├── app.js                          # Konfigurasi Express, middleware, session, dan router
├── .env                            # Konfigurasi database & session secret
├── lib/
│   └── db.js                       # Koneksi database MySQL Pool menggunakan mysql2
├── middlewares/
│   ├── auth.js                     # Middleware otentikasi login (isAuthenticated)
│   ├── acl.js                      # Middleware RBAC (checkRole & checkPermission)
│   └── error.js                    # Handler error terpusat (404 & 500)
├── controllers/
│   ├── indexController.js          # Controller login, logout, dan beranda
│   ├── surveyController.js         # Controller fitur Arifah (6 fitur)
│   └── adminRespondenController.js # Controller fitur Aqila (6 fitur)
├── routes/
│   ├── index.js                    # Router login, logout, dan dashboard utama
│   ├── users.js                    # Router user management
│   ├── survey.js                   # Router modul survei responden
│   ├── adminSurvey.js              # Router modul rekap admin (Arifah)
│   ├── adminResponden.js           # Router modul responden admin (Aqila)
│   └── api.js                      # Router endpoint REST API
├── views/
│   ├── login.ejs                   # Template halaman login
│   ├── home.ejs                    # Layout utama admin & responden (Basecoat UI)
│   ├── index.ejs                   # Template index
│   └── error.ejs                   # Template error page
└── scripts/
    ├── init_db.js                  # Inisialisasi awal tabel user (dari dosen)
    └── seed.js                     # Seeder skema database & data dummy kuesioner lengkap
```

---

## Cara Instalasi & Menjalankan Project

### 1. Prasyarat
Pastikan Anda sudah menginstal:
- Node.js (v16 atau lebih baru)
- MySQL / MariaDB Server

### 2. Kloning dan Instal Dependensi
Masuk ke direktori project, lalu jalankan perintah:
```bash
npm install
```

### 3. Konfigurasi Database (`.env`)
Buat atau edit file `.env` di root direktori project dan isi konfigurasinya:
```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=
DB_NAME=facultyware
SESSION_SECRET=rahasia123
```

### 4. Buat Database dan Migrasi Data
1. Buat database kosong bernama `facultyware` di MySQL Anda.
2. Jalankan script seeder untuk membuat semua tabel (termasuk tabel ACL, kuesioner, unit organisasi) serta memasukkan data dummy lengkap:
```bash
node scripts/seed.js
```

### 5. Jalankan Server
Jalankan server dalam mode development menggunakan perintah:
```bash
npm run dev
```
Aplikasi akan berjalan di `http://localhost:3000` (atau port default yang ditentukan di `bin/www`).

---

## Akun Demo & PIN Survei (Dummy Data)

Gunakan kredensial berikut untuk menguji sistem:

| Peran (Role) | Email Login | Password | Keterangan |
| :--- | :--- | :--- | :--- |
| **Admin** | `admin@fti.ac.id` | `admin123` | Akses penuh ke dashboard admin |
| **Respondent** | `rifaqila@fti.ac.id` | `user123` | Mengisi kuesioner |

### PIN Kuesioner untuk `rifaqila@fti.ac.id`:
- **Survey Kepuasan Layanan Akademik**: `PIN001`
- **Survey Evaluasi Fasilitas Kampus**: `PIN002`