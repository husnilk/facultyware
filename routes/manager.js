const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/equipmentManagerController');
const { isAuthenticated } = require('../middlewares/auth');
const { checkPermission } = require('../middlewares/acl');

const canManage = [isAuthenticated, checkPermission('manage-equipment-loans')];

// Dashboard – peminjaman yang sedang berlangsung
router.get('/ongoing', ...canManage, ctrl.ongoing);

// Export PDF – peminjaman yang sedang berlangsung
router.get('/ongoing/export', ...canManage, ctrl.exportOngoingPDF);

// Dashboard – riwayat peminjaman (search & filter via query string)
router.get('/', ...canManage, ctrl.index);

// Detail peminjaman
router.get('/detail/:id', ...canManage, ctrl.detail);

// Preview laporan (HTML)
router.get('/report/preview', ...canManage, ctrl.previewReport);

// Export PDF
router.get('/report/export', ...canManage, ctrl.exportPDF);

// Export CSV (status peminjaman)
router.get('/report/export-csv', ...canManage, ctrl.exportCSV);

// Approve a single loan
router.post('/loan/:id/approve', ...canManage, ctrl.approveLoan);

// Return a single loan (dikembalikan)
router.post('/loan/:id/return', ...canManage, ctrl.returnLoan);

// Reject a single loan
router.post('/loan/:id/reject', ...canManage, ctrl.rejectLoan);

// Bulk cancel selected loans
router.post('/loans/cancel', ...canManage, ctrl.cancelLoans);



module.exports = router;
