const express = require('express');
const router = express.Router();
const ticketsController = require('../controllers/ticketsController');
const { isAuthenticated } = require('../middlewares/auth');

// Lihat tiket (Harus login)
router.get('/:ticketNumber', isAuthenticated, ticketsController.show);

module.exports = router;
