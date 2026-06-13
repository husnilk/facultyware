const express = require('express');
const router = express.Router();
const atasanController = require('../controllers/atasanController');
const { isAuthenticated } = require('../middlewares/auth');
const acl = require('../middlewares/acl');

// Mengunci rute ini hanya untuk yang sudah login DAN memiliki role 'atasan_lvl_1'
router.use(isAuthenticated, acl.checkRole('atasan_lvl_1'));

router.get('/', atasanController.index);

module.exports = router;