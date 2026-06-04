var express = require('express');
var router = express.Router();

const checkinsController = require('../controllers/checkinsController');
const { isAuthenticated } = require('../middlewares/auth');

router.get('/', isAuthenticated, checkinsController.index);
router.post('/process', isAuthenticated, checkinsController.process);

module.exports = router;