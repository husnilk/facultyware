var express = require('express');
var router = express.Router();
const { isAuthenticated } = require('../middlewares/auth');
const { checkRole } = require('../middlewares/acl');
const surveyController = require('../controllers/surveyController');

router.get('/rekap', isAuthenticated, checkRole('admin'), surveyController.rekap);
router.get('/rekap/:id', isAuthenticated, checkRole('admin'), surveyController.rekapDetail);
router.get('/statistik', isAuthenticated, checkRole('admin'), surveyController.statistik);
router.get('/statistik/:id', isAuthenticated, checkRole('admin'), surveyController.statistikDetail);
router.get('/export/:id', isAuthenticated, checkRole('admin'), surveyController.exportCsv);

module.exports = router;