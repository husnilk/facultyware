# Facultyware Survey System

## Deskripsi Aplikasi

Facultyware Survey System merupakan aplikasi berbasis web yang digunakan untuk mengelola survey secara digital. Sistem menyediakan fitur manajemen survey, pertanyaan, opsi jawaban, assignment pertanyaan ke survey, REST API, export PDF, serta autentikasi pengguna menggunakan session.

Fitur utama yang tersedia:

- Login dan Logout
- CRUD Survey
- Publish Survey
- Search dan Pagination Survey
- Export PDF Survey
- REST API Survey
- CRUD Pertanyaan Survey
- REST API Pertanyaan
- CRUD Opsi Jawaban
- CRUD Assignment Pertanyaan ke Survey
- Validasi Form
- Session Based Access Control

---

## Cara Instalasi dan Menjalankan Aplikasi

### Clone Repository

```bash
git clone https://github.com/hanifalhaj05-a11y/facultyware.git
cd facultyware
```

### Install Dependency

```bash
npm install
```

### Buat Database MySQL

```sql
CREATE DATABASE facultyware;
```

Import file database ke database `facultyware`.

### Konfigurasi Environment

Buat file `.env`

```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=
DB_NAME=facultyware
PORT=3000
SESSION_SECRET=facultyware
```

### Menjalankan Aplikasi

```bash
npm start
```

atau

```bash
node app.js
```

Aplikasi dapat diakses melalui:

```text
http://localhost:3000
```

---

## Pembagian Tugas Anggota

| NIM | Nama | Tugas |
|------|------|--------|
| 2411523023 | Hanif Al Haj | Implementasi Authentication, Session Based Access Control, CRUD Survey, CRUD Pertanyaan, CRUD Opsi Jawaban, CRUD Assignment, REST API, Export PDF, Validasi Form, Testing Playwright, Deployment |
