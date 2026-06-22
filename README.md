# Sistem Informasi Cuti Pegawai - Facultyware

## Deskripsi Aplikasi
**Sistem Informasi Cuti Pegawai (Facultyware)** adalah portal administrasi berbasis web yang dirancang khusus untuk Fakultas Teknologi Informasi, Universitas Andalas. Aplikasi ini bertujuan untuk mendigitalkan dan mengotomatisasi proses pengajuan, verifikasi, serta pemantauan cuti pegawai secara tertib, transparan, dan terintegrasi. 

Aplikasi ini mendukung sistem *multi-role* dengan hak akses yang disesuaikan:
* **Pegawai:** Mengajukan cuti, melihat status persetujuan, melihat alasan penolakan, dan mencetak riwayat cuti.
* **Atasan Level 1:** Memantau daftar pengajuan cuti pegawai yang menunggu persetujuan dan melihat riwayat pengajuan.
* **Atasan Level 2:** Menyetujui (*Approve*) atau menolak (*Reject*) pengajuan cuti beserta penambahan catatan/komentar, serta mencetak riwayat persetujuan.
* **Admin:** Memantau seluruh rekapitulasi data cuti fakultas, memfilter laporan, melihat statistik tren cuti, serta mengekspor laporan dalam bentuk PDF dan DOCX.

## Cara Instalasi dan Menjalankan Aplikasi

### Prasyarat Sistem
Sebelum menjalankan aplikasi, pastikan sistem Anda sudah terinstal:
* **Node.js** (Versi 14.x atau lebih baru)
* **MySQL Server** (XAMPP / Laragon / MySQL Workbench)
* **Git** (Opsional, untuk *cloning* repositori)

### Langkah-langkah Instalasi
1.  **Unduh / Clone Repositori**
    Ekstrak file *source code* aplikasi ke dalam direktori lokal komputer Anda, atau gunakan Git:
    ```bash
    git clone [URL_REPOSITORI_ANDA]
    cd [NAMA_FOLDER_PROJECT]
    ```

2.  **Instalasi Dependensi**
    Buka terminal/Command Prompt di dalam direktori aplikasi, lalu jalankan perintah berikut untuk menginstal semua *library* yang dibutuhkan (Express, MySQL2, EJS, PDFKit, dll):
    ```bash
    npm install
    ```

3.  **Konfigurasi Database**
    * Buka aplikasi MySQL (misal: phpMyAdmin melalui XAMPP).
    * Buat *database* baru dengan nama `facultyware`.
    * Lakukan *Import* file SQL yang telah disediakan (misal: `facultyware.sql`) ke dalam *database* tersebut.

4.  **Pengaturan Environment (.env)**
    Buat file bernama `.env` di *root* direktori proyek Anda (sejajar dengan `package.json`). Sesuaikan konfigurasi *database* Anda seperti contoh berikut:
    ```env
    DB_HOST=localhost
    DB_USER=root
    DB_PASSWORD=
    DB_NAME=facultyware
    PORT=3000
    ```

5.  **Menjalankan Aplikasi**
    Jalankan perintah berikut di terminal untuk menyalakan *server*:
    ```bash
    npm start
    ```
    *(Atau gunakan `npm run dev` jika Anda menggunakan nodemon untuk mode pengembangan).*

6.  **Akses Aplikasi**
    Buka *web browser* (Chrome, Firefox, Safari) dan akses alamat:
    **`http://localhost:3000`**

## Pembagian Tugas Anggota

Pengembangan sistem ini dibagi menjadi 3 modul utama yang dikerjakan oleh masing-masing penanggung jawab sebagai berikut:

| Nama Penanggung Jawab | NIM | Modul & Fitur yang Dikerjakan |
| :--- | :--- | :--- |
| **Zizi Salsabila** | 2411523034 | **Modul Pegawai:** <br>• Membuat pengajuan cuti <br>• Melihat riwayat, detail, dan status pengajuan <br>• Mengubah & menghapus pengajuan cuti <br>• Melihat notifikasi *approval* beserta komentar penolakan <br>• Mengekspor riwayat cuti personal ke PDF <br>• *RestAPI* Riwayat Cuti Personal (`GET /pegawai/api/riwayat`) |
| **Fazila Hassana Rahmat** | 2411523012 | **Modul Atasan & Atasan Lvl 2:** <br>• Memfilter, mencari, dan melihat detail daftar pengajuan cuti (Atasan) <br>• Melihat pengajuan cuti yang menunggu persetujuan (Atasan Lvl 2) <br>• Menyetujui (*Approve*) & menolak (*Reject*) pengajuan cuti <br>• Memasukkan komentar/alasan penolakan <br>• Mengekspor riwayat *approval* ke PDF <br>• *RestAPI* Pending & Detail Cuti |
| **Naufal Baihaqi Zachwan** | 2411522025 | **Modul Admin & Atasan (Viewer):** <br>• Melihat daftar pengajuan cuti pegawai (Atasan Lvl 1) <br>• Melihat rekapitulasi data cuti pegawai (Admin) <br>• Memfilter laporan cuti pegawai <br>• Melihat statistik & visualisasi tren data cuti <br>• Mengekspor laporan global ke format PDF dan DOCX <br>• *RestAPI* Statistik & Rekapitulasi Global (`GET /admin/api/statistik`) |