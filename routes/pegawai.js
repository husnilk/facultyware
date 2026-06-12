const express = require('express');
const router = express.Router();
const pegawaiController = require('../controllers/pegawaiController');
const { isAuthenticated } = require('../middlewares/auth');
const acl = require('../middlewares/acl');

// Semua rute ini dilindungi middleware login dan role check pegawai
router.use(isAuthenticated, acl.checkRole('pegawai'));

// Halaman dashboard utama pegawai
router.get('/', pegawaiController.index);

// Riwayat pengajuan cuti (dengan search, pagination, sorting)
router.get('/cuti', pegawaiController.renderCutiRiwayat);

// Export riwayat cuti (Fitur 8) - HARUS sebelum route /cuti/:id
router.get('/cuti/export/pdf', pegawaiController.exportCutiPDF);

// Form buat pengajuan cuti
router.get('/cuti/tambah', pegawaiController.renderCutiTambah);
router.post('/cuti/tambah', pegawaiController.processCutiTambah);

// Detail pengajuan cuti
router.get('/cuti/:id', pegawaiController.renderCutiDetail);

// Ubah pengajuan cuti (hanya jika status masih pending)
router.get('/cuti/:id/edit', pegawaiController.renderCutiEdit);
router.post('/cuti/:id/edit', pegawaiController.processCutiEdit);

// Hapus pengajuan cuti (hanya jika status masih pending)
router.post('/cuti/:id/delete', pegawaiController.processCutiDelete);

// Halaman notifikasi pegawai
router.get('/notifikasi', pegawaiController.renderNotifikasi);

// API untuk menandai notifikasi telah dibaca
router.post('/notifikasi/:id/read', pegawaiController.processMarkAsRead);


module.exports = router;