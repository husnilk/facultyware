var express = require('express');
var router = express.Router();

const remindersController = require('../controllers/remindersController');
const { isAuthenticated } = require('../middlewares/auth');

router.get('/', isAuthenticated, remindersController.index);
router.post('/send', isAuthenticated, remindersController.send);
router.get('/history', isAuthenticated, remindersController.history);

module.exports = router;