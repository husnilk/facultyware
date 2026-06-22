const express = require('express');
const router = express.Router();
const pegawaiController = require('../controllers/pegawaiController');
const { isAuthenticated } = require('../middlewares/auth');
const acl = require('../middlewares/acl');

// Kunci rute ini khusus untuk Pegawai
router.use(isAuthenticated, acl.checkRole('pegawai'));

// Dashboard (Statistik & Pending)
router.get('/', pegawaiController.index);

// Riwayat (Approved & Rejected)
router.get('/riwayat', pegawaiController.riwayat);

// --- RUTE HALAMAN NOTIFIKASI ---
// (Wajib diletakkan di atas rute /:id agar tidak dianggap sebagai ID pengajuan)
router.get('/notifications', pegawaiController.notifications);

// --- ENDPOINT REST API ---
router.get('/api/riwayat', pegawaiController.getRiwayatAPI);

// --- ENDPOINT EXPORT PDF ---
router.get('/export-pdf', pegawaiController.exportPdf);

// Buat Pengajuan Cuti
router.get('/create', pegawaiController.create);
router.post('/create', pegawaiController.store);

// Detail Pengajuan (RUTE DINAMIS :id HARUS DI BAWAH)
router.get('/:id', pegawaiController.detail);

// Ubah Pengajuan (Edit)
router.get('/:id/edit', pegawaiController.edit);
router.post('/:id/edit', pegawaiController.update);

// Hapus Pengajuan
router.post('/:id/delete', pegawaiController.delete);

module.exports = router;