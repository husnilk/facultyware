var express = require('express');
var router = express.Router();
const { isAuthenticated } = require('../middlewares/auth');
const { checkRole } = require('../middlewares/acl');
const surveyController = require('../controllers/surveyController');

router.get('/', isAuthenticated, checkRole('respondent'), surveyController.index);
router.get('/:id', isAuthenticated, checkRole('respondent'), surveyController.pinForm);
router.post('/:id/pin', isAuthenticated, checkRole('respondent'), surveyController.pinValidate);
router.get('/:id/fill', isAuthenticated, checkRole('respondent'), surveyController.fillForm);
router.post('/:id/submit', isAuthenticated, checkRole('respondent'), surveyController.submit);

module.exports = router;