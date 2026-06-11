const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { isAuthenticated } = require('../middlewares/auth');
const acl = require('../middlewares/acl');

// Kunci rute ini khusus untuk Admin
router.use(isAuthenticated, acl.checkRole('admin'));

// Endpoint utama (Rekap Cuti)
router.get('/', adminController.index);

// Endpoint Statistik
router.get('/statistik', adminController.statistik);

// Endpoint untuk Ekspor File
router.get('/export/pdf', adminController.exportPdf);
router.get('/export/docx', adminController.exportDocx);

module.exports = router;