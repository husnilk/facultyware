const express = require('express');
const router = express.Router();
const apiController = require('../controllers/apiController');
const { isAuthenticated } = require('../middlewares/auth');

// Pegawai API
router.get('/my-travel', isAuthenticated, apiController.getMyTravel);
router.get('/my-expenses', isAuthenticated, apiController.getMyExpenses);
router.get('/my-documents', isAuthenticated, apiController.getMyDocuments);

// Pimpinan API
router.get('/travel', isAuthenticated, apiController.getTravel);
router.get('/travel/:id', isAuthenticated, apiController.getTravelById);
router.get('/expenses', isAuthenticated, apiController.getExpenses);
router.get('/reports', isAuthenticated, apiController.getReports);

module.exports = router;
