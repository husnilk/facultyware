var express = require('express');
var router = express.Router();
const { isAuthenticated } = require('../middlewares/auth');
const surveyController = require('../controllers/surveyController');
const adminRespondenController = require('../controllers/adminRespondenController');

router.get('/surveys', isAuthenticated, surveyController.apiSurveys);
router.get('/surveys/:id/rekap', isAuthenticated, adminRespondenController.apiRekap);

module.exports = router;