const express = require('express');
const router = express.Router();
const equipmentLoanController = require('../controllers/equipmentLoanController');
const { isAuthenticated } = require('../middlewares/auth');

// 1. Dashboard Pengajuan
router.get('/', isAuthenticated, equipmentLoanController.index);

// 2. Tambah Pengajuan
router.get('/create', isAuthenticated, equipmentLoanController.createPage);
router.post('/create', isAuthenticated, equipmentLoanController.create);

// 3. Edit Pengajuan
router.get('/edit/:id', isAuthenticated, equipmentLoanController.editPage);
router.post('/edit/:id', isAuthenticated, equipmentLoanController.update);

// 4. Batal Pengajuan
router.post('/cancel/:id', isAuthenticated, equipmentLoanController.cancel);

// 5. Cetak Bukti PDF
router.get('/cetak/:id', isAuthenticated, equipmentLoanController.cetak);



module.exports = router;