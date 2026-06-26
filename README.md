# Facultyware - Central Panel

Aplikasi sistem informasi akademik dan manajemen event.

## Ghufran API Module

REST API endpoint untuk integrasi mobile atau pihak ketiga terkait pendaftaran event.
Base URL: `/api/ghufran`

### 1. Dapatkan Daftar Event
`GET /api/ghufran/events`
Parameter query opsional:
- `q`: string pencarian (judul / deskripsi)
- `page`: nomor halaman (default: 1)
- `limit`: item per halaman (default: 10)

### 2. Registrasi Event
`POST /api/ghufran/events/:id/register`
Body (JSON):
```json
{
  "userId": 1,
  "notes": "Alergi seafood"
}
```

### 3. Detail Tiket
`GET /api/ghufran/tickets/:ticketNumber`
Mengembalikan info registrasi beserta data *Data URI* dari QR Code e-ticket.
