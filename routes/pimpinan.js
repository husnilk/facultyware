const express = require('express');
const router = express.Router();
const pimpinanController = require('../controllers/pimpinanController');
const { isAuthenticated } = require('../middlewares/auth');
const { isPimpinan } = require('../middlewares/role');

// Protect all routes
router.use(isAuthenticated, isPimpinan);

// Dashboard
router.get('/dashboard', pimpinanController.dashboard);

// Travel Approvals
router.get('/travels', pimpinanController.listTravels);
router.get('/travels/detail/:id', pimpinanController.travelDetail);
router.post('/travels/approve/:id', pimpinanController.approveTravel);
router.post('/travels/reject/:id', pimpinanController.rejectTravel);

// Expense Approvals
router.get('/expenses', pimpinanController.listExpenses);
router.get('/expenses/approve/:id', pimpinanController.approveExpense);
router.get('/expenses/reject/:id', pimpinanController.rejectExpense);

// Completed Travel Reports
router.get('/reports', pimpinanController.listReports);

// Exports
router.get('/export/travels', pimpinanController.exportAllTravels);
router.get('/export/expenses', pimpinanController.exportAllExpenses);
router.get('/api/travels-json', pimpinanController.getAllTravelsJSON);

module.exports = router;
