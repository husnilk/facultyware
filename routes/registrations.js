const express = require('express');
const router = express.Router();
const registrationsController = require('../controllers/registrationsController');
const { isAuthenticated } = require('../middlewares/auth');

// List event yang tersedia
router.get('/', registrationsController.index);

// Detail event
router.get('/:id', registrationsController.detail);

// Form pendaftaran (Harus login)
router.get('/:id/register', isAuthenticated, registrationsController.form);

// Proses pendaftaran (Harus login)
router.post('/:id/register', isAuthenticated, registrationsController.store);

module.exports = router;
