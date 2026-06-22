# Dokumentasi Automated Testing (Ghufran #14)

Modul Registrasi dan E-Ticket telah berhasil melewati tahap pengujian (*Automated Testing*) secara menyeluruh menggunakan `jest` dan `supertest`. Pengujian ini dibuat untuk memastikan fungsionalitas dan integrasi API tidak rusak.

## Hasil Pengujian (Test Results)

Semua skenario pengujian utama (7 tests) berhasil lolos (✅ PASS) pada `tests/ghufran-registration.spec.js`:

1. ✅ **Test daftar event**: Endpoint `/events` berhasil mengembalikan halaman HTML berisikan teks "Katalog Event".
2. ✅ **Test detail event**: Endpoint `/events/:id` berhasil mengembalikan halaman detail sebuah event tertentu berdasarkan ID.
3. ✅ **Test pendaftaran event**: Proses *POST* pendaftaran (`/api/ghufran/events/:id/register`) berhasil memproses pendaftaran, menghasilkan respon HTTP 201 Created dan mengeluarkan `ticket_number`.
4. ✅ **Test pendaftaran ganda ditolak**: Proses pendaftaran untuk user yang sama pada event yang sama ditolak (HTTP 409 Conflict) dan sistem mengeluarkan pesan error dengan status `success: false`.
5. ✅ **Test e-ticket tampil**: Endpoint tiket (`/tickets/:ticketNumber`) berhasil memuat halaman E-ticket lengkap dengan QR code berformat base64.
6. ✅ **Test download e-ticket**: Endpoint unduh (`/tickets/:ticketNumber/download`) berhasil menghasilkan PDF (Content-Type: `application/pdf`).
7. ✅ **Test API registration**: Endpoint `GET /api/ghufran/events` berhasil mengembalikan *JSON list array*.

> [!TIP]
> Waktu eksekusi keseluruhan *test suite* memakan waktu ~2 detik, dengan dukungan deteksi *mock session*.

## Cara Menjalankan Test

Untuk menjalankan ulang pengujian ini di masa mendatang, cukup eksekusi perintah berikut di root repositori:

```bash
npm test
```

Perintah di atas akan secara otomatis memanggil `jest` untuk mengeksekusi semua file yang berakhiran `.spec.js`.

## Catatan Database Cleanup
Test suite ini mengisolasi datanya sendiri dengan cara:
1. Menyisipkan (INSERT) *dummy event* ke dalam tabel `events` sesaat sebelum pengujian (`beforeAll`).
2. Melakukan penghapusan ulang (DELETE) *event* tersebut dan seluruh riwayat registrasinya dari database sesaat setelah test selesai (`afterAll`).
Sehingga database utama tidak terkontaminasi oleh data pengujian fiktif.
