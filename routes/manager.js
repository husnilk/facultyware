const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/equipmentManagerController');
const { isAuthenticated } = require('../middlewares/auth');
const { checkPermission } = require('../middlewares/acl');

const canManage = [isAuthenticated, checkPermission('manage-equipment-loans')];

// Dashboard – riwayat peminjaman (search & filter via query string)
router.get('/', ...canManage, ctrl.index);

// Detail peminjaman
router.get('/detail/:id', ...canManage, ctrl.detail);

// Preview laporan (HTML)
router.get('/report/preview', ...canManage, ctrl.previewReport);

// Export PDF
router.get('/report/export', ...canManage, ctrl.exportPDF);

// ── API endpoints ──────────────────────────────
// Total semua peminjaman
router.get('/api/loans/total', isAuthenticated, ctrl.apiTotalLoans);

// Total peminjaman belum dikembalikan
router.get('/api/loans/unreturned', isAuthenticated, ctrl.apiUnreturnedLoans);

module.exports = router;
