const express = require('express');
const router = express.Router();
const atasanLvl2Controller = require('../controllers/atasanLvl2Controller');
const { isAuthenticated } = require('../middlewares/auth');
const acl = require('../middlewares/acl');

// Kunci rute ini khusus untuk Atasan Level 2
router.use(isAuthenticated, acl.checkRole('atasan_lvl_2'));

// Endpoint utama
router.get('/', atasanLvl2Controller.index);

module.exports = router;