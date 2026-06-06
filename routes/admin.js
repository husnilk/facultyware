const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { isAuthenticated } = require('../middlewares/auth');
const acl = require('../middlewares/acl');

// Kunci rute ini khusus untuk Admin
router.use(isAuthenticated, acl.checkRole('admin'));

// Endpoint utama
router.get('/', adminController.index);

module.exports = router;