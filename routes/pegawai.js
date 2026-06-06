const express = require('express');
const router = express.Router();
const pegawaiController = require('../controllers/pegawaiController');
const { isAuthenticated } = require('../middlewares/auth');
const acl = require('../middlewares/acl');

// Kunci rute ini khusus untuk Pegawai
router.use(isAuthenticated, acl.checkRole('pegawai'));

// Endpoint utama
router.get('/', pegawaiController.index);

module.exports = router;