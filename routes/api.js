const express = require('express');
const router = express.Router();
const apiController = require('../controllers/apiController');
const { isAuthenticated } = require('../middlewares/auth');

// Manager APIs
router.get('/manager/loans/total', isAuthenticated, apiController.totalLoans);
router.get('/manager/loans/requested', isAuthenticated, apiController.requestedLoans);
router.get('/manager/loans/unreturned', isAuthenticated, apiController.unreturnedLoans);

// Equipment Loans APIs
router.get('/equipment-loans/track/:id', isAuthenticated, apiController.trackLoan);

module.exports = router;
