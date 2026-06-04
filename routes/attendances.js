var express = require('express');
var router = express.Router();

const attendancesController = require('../controllers/attendancesController');
const { isAuthenticated } = require('../middlewares/auth');

router.get('/', isAuthenticated, attendancesController.index);
router.get('/recap', isAuthenticated, attendancesController.recap);
router.get('/export/excel', isAuthenticated, attendancesController.exportExcel);

module.exports = router;