# FacultyWare — Modul Manajemen Aset Peralatan

Aplikasi web untuk pengelolaan **aset peralatan fakultas**. Mencakup manajemen
data aset & kategori aset (CRUD lengkap), kontrol akses berbasis peran (ACL),
pencarian + pagination, export data ke Excel/CSV, dan REST API berformat JSON.

---

## ✨ Fitur Utama

### Kategori Aset Peralatan (CRUD + Search + Import/Export + API)
- Tambah, lihat daftar, ubah, dan hapus kategori aset
- Pencarian kategori (kode / nama / deskripsi) + pagination
- Export data kategori ke **Excel (.xlsx)** dan **CSV**
- REST API JSON: `GET`, `POST`, `PUT`, `DELETE`

### Aset Peralatan (CRUD + Search + Import/Export + API)
- Tambah aset baru beserta detail teknis + upload foto (opsional)
- Daftar lengkap aset dengan pencarian (nama / kode / spesifikasi / merek / no. seri)
- Filter berdasarkan kondisi & status + pagination
- Hapus aset (otomatis menghapus foto dari disk)
- Export ringkasan aset ke **Excel (.xlsx)** dan **CSV**
- REST API JSON: `GET`, `POST`, `PUT`, `DELETE` + endpoint statistik

---

## 🛠️ Tech Stack

| Komponen | Teknologi |
|----------|-----------|
| Backend Framework | Express.js |
| Template Engine | EJS |
| Database | MySQL (driver native `mysql2`, **tanpa ORM**) |
| Styling | Tailwind CSS via Basecoat |
| Interactivity | HTMX |
| Auth | Session-based + bcryptjs |
| ACL | Role & Permission (Spatie-style, `model_has_roles`) |
| Upload Foto | Multer |
| Export | ExcelJS (CSV & XLSX) |
| Validasi | express-validator + validasi JS murni (pada API) |

---

## 📦 Instalasi & Setup

### Prasyarat
- Node.js (v18+)
- MySQL / MariaDB (mis. via XAMPP)

### Langkah

1. **Clone & install dependencies**
   ```bash
   git clone https://github.com/Lutfihaszelm/facultyware.git
   cd facultyware
   npm install
   ```

2. **Buat database & import skema dosen**
   ```sql
   CREATE DATABASE facultyware;
   ```
   Import file `db_tb_pweb_v2.sql` ke database `facultyware`.

3. **Buat tabel kategori & kolom relasinya** (jika belum ada di skema)
   ```sql
   CREATE TABLE IF NOT EXISTS equipment_categories (
     id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
     code VARCHAR(50) NOT NULL UNIQUE,
     name VARCHAR(255) NOT NULL,
     description TEXT NULL,
     created_at TIMESTAMP NULL DEFAULT NULL,
     updated_at TIMESTAMP NULL DEFAULT NULL,
     PRIMARY KEY (id)
   ) ENGINE=InnoDB DEFAULT CHARACTER SET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

   ALTER TABLE equipments
     ADD COLUMN category_id BIGINT UNSIGNED NULL AFTER asset_id,
     ADD CONSTRAINT equipments_category_id_foreign
     FOREIGN KEY (category_id) REFERENCES equipment_categories(id) ON DELETE SET NULL;
   ```

4. **Konfigurasi environment** — buat file `.env` di root:
   ```
   DB_HOST=localhost
   DB_USER=root
   DB_PASSWORD=
   DB_NAME=facultyware
   SESSION_SECRET=ubah-dengan-string-acak
   ```

5. **Seed roles, permissions, dan akun uji**
   ```bash
   node scripts/seed_acl.js
   ```

6. **Jalankan aplikasi**
   ```bash
   npm run dev      # mode development (nodemon)
   # atau
   npm start        # mode produksi
   ```
   Akses di **http://localhost:3000**

---

## 🔐 Akun Uji

| Email | Password | Role | Hak Akses |
|-------|----------|------|-----------|
| admin@facultyware.com | password | admin | Semua CRUD + hapus + export |
| viewer@facultyware.com | password | viewer | Lihat + export saja |

---

## 🌐 Daftar Route Penting

| URL | Keterangan |
|-----|------------|
| `/login` | Halaman login |
| `/home` | Dashboard statistik |
| `/equipments` | Manajemen aset peralatan |
| `/equipment-categories` | Manajemen kategori aset |
| `/api/equipments` | REST API aset (JSON) |
| `/api/equipment-categories` | REST API kategori (JSON) |
| `/api/stats` | REST API statistik (JSON) |

---

## 👥 Pembagian Tugas Anggota

| NIM | Nama | Fitur Tanggung Jawab |
|-----|------|----------------------|
| 2411522010 | Lutfi Hazel Muhammad | **Kategori Aset Peralatan** (CRUD + Search + Export + REST API) & **Aset Peralatan** (CRUD + Search + Export + REST API) |

---

## 📁 Struktur Direktori

```
facultyware/
├── app.js                 # Entry point & registrasi route
├── bin/www                # HTTP server bootstrap
├── routes/                # Definisi route (index, equipments, equipmentCategories, api)
├── controllers/           # Logika bisnis (MVC)
├── middlewares/           # auth, acl, upload, error handler
├── lib/db.js              # Koneksi MySQL (pool mysql2)
├── views/                 # Template EJS + partials
├── public/                # Aset statis (CSS Basecoat, uploads)
└── scripts/seed_acl.js    # Seeder roles/permissions/users
```
