Facultyware
## Fitur Utama
- **Manajemen Kategori:** CRUD (Create, Read, Update, Delete) untuk mengkategorikan barang.
- **Manajemen Item:** CRUD lengkap untuk data barang.
- **Live Search:** Pencarian barang instan menggunakan HTMX tanpa *reload* halaman.
- **Export/Import Excel:** Kemudahan migrasi data barang melalui format file Excel (.xlsx).

## Tech Stack
- **Backend:** Node.js & Express.js
- **Frontend:** EJS (Embedded JavaScript Templates)
- **Styling:** Tailwind CSS
- **Database:** MySQL
- **Library Tambahan:** HTMX, Multer (Upload), SheetJS (XLSX)

## Cara Menjalankan Aplikasi

1. **Clone Repository:**
   ```bash
   git clone [https://github.com/daffuu/facultyware.git](https://github.com/daffuu/facultyware.git)
   cd facultyware

2. **Install Dependencies**
   npm install

3. **Konfigurasi Database**
   -Pastikan MySQL (Laragon/XAMPP) berjalan.
   -Buat database baru.
   -Import file db_tb_pweb_v2.sql melalui PhpMyAdmin.
   -Sesuaikan konfigurasi database di file koneksi (lib/db.js).

4. **Jalankan**
   npm start
   Akses aplikasi di: http://localhost:3000
