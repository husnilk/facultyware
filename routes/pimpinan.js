const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const pimpinanController = require('../controllers/pimpinanController');
const { isAuthenticated } = require('../middlewares/auth');
const { isPimpinan } = require('../middlewares/role');

// Multer Config
const docStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../public/uploads/documents'));
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname);
  }
});
const uploadDocs = multer({ storage: docStorage });

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
router.get('/export/reports', pimpinanController.exportAllReports);
router.get('/api/travels-json', pimpinanController.getAllTravelsJSON);
router.post('/import/travels', uploadDocs.single('importFile'), pimpinanController.importAllTravels);

module.exports = router;
