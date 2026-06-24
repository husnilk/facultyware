const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const pegawaiController = require('../controllers/pegawaiController');
const { isAuthenticated } = require('../middlewares/auth');
const { isPegawai } = require('../middlewares/role');

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

const receiptStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../public/uploads/receipts'));
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname);
  }
});
const uploadReceipts = multer({ storage: receiptStorage });

// Protect all routes
router.use(isAuthenticated, isPegawai);

// Dashboard
router.get('/dashboard', pegawaiController.dashboard);

// Travels CRUD
router.get('/travels', pegawaiController.listTravels);
router.get('/travels/create', pegawaiController.travelForm);
router.post('/travels/create', uploadDocs.single('invitation'), pegawaiController.saveTravel);
router.get('/travels/edit/:id', pegawaiController.travelForm);
router.post('/travels/edit/:id', uploadDocs.single('invitation'), pegawaiController.saveTravel);
router.get('/travels/detail/:id', pegawaiController.travelDetail);
router.get('/travels/delete/:id', pegawaiController.deleteTravel);
router.get('/travels/submit/:id', pegawaiController.submitTravel);

// Document upload
router.post('/documents/upload', uploadDocs.single('file'), pegawaiController.uploadDocument);
router.get('/documents/delete/:id', pegawaiController.deleteDocument);

// Itineraries
router.post('/itineraries/save', pegawaiController.saveItinerary);
router.get('/itineraries/delete/:id', pegawaiController.deleteItinerary);

// Members
router.post('/members/save', uploadDocs.single('attachment'), pegawaiController.saveMember);
router.get('/members/delete/:id', pegawaiController.deleteMember);

// Outcome Report
router.post('/travels/outcome/:id', pegawaiController.saveOutcome);

// Expenses CRUD
router.get('/expenses', pegawaiController.listExpenses);
router.get('/expenses/create', pegawaiController.expenseForm);
router.post('/expenses/create', uploadReceipts.single('receipt'), pegawaiController.saveExpense);
router.get('/expenses/edit/:id', pegawaiController.expenseForm);
router.post('/expenses/edit/:id', uploadReceipts.single('receipt'), pegawaiController.saveExpense);
router.get('/expenses/delete/:id', pegawaiController.deleteExpense);

// Export & Import
router.get('/export/travels', pegawaiController.exportTravels);
router.post('/import/travels', uploadDocs.single('importFile'), pegawaiController.importTravels);
router.get('/export/expenses', pegawaiController.exportExpenses);
router.get('/travels/print/:id', pegawaiController.printTravelPDF);

module.exports = router;
