const express = require('express');
const router = express.Router();
const pegawaiController = require('../controllers/pegawaiController');
const { isAuthenticated } = require('../middlewares/auth');
const acl = require('../middlewares/acl');

// Kunci rute ini khusus untuk Pegawai
router.use(isAuthenticated, acl.checkRole('pegawai'));

// Riwayat Dashboard
router.get('/', pegawaiController.index);

// --- ENDPOINT REST API ---
router.get('/api/riwayat', pegawaiController.getRiwayatAPI);

// --- ENDPOINT EXPORT PDF ---
// Rute ini memenuhi Syarat Poin B Tugas
router.get('/export-pdf', pegawaiController.exportPdf);

// Buat Pengajuan Cuti
router.get('/create', pegawaiController.create);
router.post('/create', pegawaiController.store);

// Detail Pengajuan (Rute dengan parameter :id harus di bawah rute statis)
router.get('/:id', pegawaiController.detail);

// Ubah Pengajuan (Edit)
router.get('/:id/edit', pegawaiController.edit);
router.post('/:id/edit', pegawaiController.update);

// Hapus Pengajuan
router.post('/:id/delete', pegawaiController.delete);

module.exports = router;