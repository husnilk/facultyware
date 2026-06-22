const express = require('express'); // Import framework Express
const router = express.Router();    // Buat instance router
const purchaseController = require('../controllers/purchaseController'); // Import controller
const { checkPermission } = require('../middlewares/acl');

// Daftar PO (list semua Purchase Order)
router.get('/', checkPermission('manage_po'), purchaseController.index);

// Form buat PO (halaman create)
router.get('/create', checkPermission('manage_po'), purchaseController.create);

// Simpan PO baru (proses POST form create)
router.post('/create', checkPermission('manage_po'), purchaseController.store);

// API JSON untuk daftar PO
// NOTE: define API and non-:id routes before the '/:id' param route
router.get('/api/list', checkPermission('manage_po'), purchaseController.apiList);
router.get('/api/purchase', checkPermission('manage_po'), purchaseController.apiList);

// API: items untuk procurement tertentu (dipakai oleh halaman create)
router.get('/api/procurement/:id/items', checkPermission('manage_po'), purchaseController.procurementItems);

// Dashboard statistik (mounted under /purchase/dashboard)
router.get('/dashboard', checkPermission('manage_po'), purchaseController.dashboard);
// Export PO ke PDF (static before param)
// Wadir (manage_approval) juga boleh mengunduh untuk meninjau saat menyetujui.
router.get('/:id/export', checkPermission(['manage_po', 'manage_approval']), purchaseController.exportPDF);

// Update status PO (approved → completed)
router.post('/:id/status', checkPermission('manage_po'), purchaseController.updateStatus);

// Persetujuan PO oleh Wakil Dekan (gerbang ke-2)
router.post('/:id/approve', checkPermission('manage_approval'), purchaseController.approve);
router.post('/:id/reject', checkPermission('manage_approval'), purchaseController.reject);

// Detail PO berdasarkan ID (param last)
// Wadir (manage_approval) perlu membuka detail ini untuk meninjau harga
// sebelum menyetujui PO pada gerbang ke-2.
router.get('/:id', checkPermission(['manage_po', 'manage_approval']), purchaseController.detail);

module.exports = router; // Export router supaya bisa dipakai di app.js
