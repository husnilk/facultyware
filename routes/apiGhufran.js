const express = require('express');
const router = express.Router();
const apiGhufranController = require('../controllers/apiGhufranController');

// Daftar Event
router.get('/events', apiGhufranController.getEvents);

// Registrasi Event
router.post('/events/:id/register', apiGhufranController.registerEvent);

// Detail Tiket
router.get('/tickets/:ticketNumber', apiGhufranController.getTicketDetail);

module.exports = router;
