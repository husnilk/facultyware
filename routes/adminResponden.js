var express = require('express');
var router = express.Router();
const { isAuthenticated } = require('../middlewares/auth');
const { checkRole } = require('../middlewares/acl');
const adminRespondenController = require('../controllers/adminRespondenController');

router.get('/', isAuthenticated, checkRole('admin'), adminRespondenController.dashboard);
router.get('/:id', isAuthenticated, checkRole('admin'), adminRespondenController.respondenList);
router.post('/:id/toggle', isAuthenticated, checkRole('admin'), adminRespondenController.toggleAktif);
router.get('/:id/riwayat', isAuthenticated, checkRole('admin'), adminRespondenController.riwayat);
router.get('/:id/pdf', isAuthenticated, checkRole('admin'), adminRespondenController.exportPdf);

module.exports = router;