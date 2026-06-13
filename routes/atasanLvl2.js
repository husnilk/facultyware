const express = require('express');
const router = express.Router();
const atasanLvl2Controller = require('../controllers/atasanLvl2Controller');
const { isAuthenticated } = require('../middlewares/auth');
const acl = require('../middlewares/acl');

// Kunci rute ini khusus untuk Atasan Level 2
router.use(isAuthenticated, acl.checkRole('atasan_lvl_2'));

// Endpoint utama
router.get('/', atasanLvl2Controller.index);

// API routes
router.get('/api/cuti/pending', atasanLvl2Controller.apiGetPendingCuti);
router.get('/api/cuti/:id', atasanLvl2Controller.apiGetDetailCuti);

// Export PDF Riwayat Atasan Level 2
router.get('/export/riwayat/pdf', atasanLvl2Controller.exportRiwayatPdf);

// Route GET daftar pengajuan cuti pending
router.get('/cuti/pending', atasanLvl2Controller.pendingCuti);

// Route POST approve
router.post('/cuti/:id/approve', (req, res, next) => {
    console.log('ROUTE POST APPROVE MASUK:', req.method, req.originalUrl, req.params.id);
    next();
}, atasanLvl2Controller.approveCuti);

// Route POST reject
router.post('/cuti/:id/reject', (req, res, next) => {
    console.log('ROUTE POST REJECT MASUK:', req.method, req.originalUrl, req.params.id);
    next();
}, atasanLvl2Controller.rejectCuti);

// Route GET detail pengajuan cuti
router.get('/cuti/:id', atasanLvl2Controller.detailCuti);

module.exports = router;