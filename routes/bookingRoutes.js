const express = require('express');
const router = express.Router();
const bookingController = require('../controllers/bookingController');

// Proteksi global session login
router.use((req, res, next) => {
    if (!req.session.user) return res.redirect('/login');
    next();
});

// RUTE CORE UTAMA
router.get('/', bookingController.getAllBookings);
router.get('/add', bookingController.getAddBookingPage);
router.post('/add', bookingController.createBooking);
router.post('/:id/action', bookingController.handleAction);

// FITUR: Pembatalan & Cetak Bukti PDF Satuan
router.post('/:id/cancel', bookingController.cancelBooking);
router.get('/:id/download', bookingController.downloadReceiptPDF);

// FITUR: Edit & Delete oleh Penanggung Jawab
router.get('/:id/edit', bookingController.getEditBookingPage);
router.post('/:id/edit', bookingController.updateBooking);
router.post('/:id/delete', bookingController.deleteBooking);

// FITUR: Ketersediaan Real-time & Laporan
router.get('/ketersediaan', bookingController.getRealtimeAvailability);
router.get('/export/riwayat', bookingController.getExportHistoryPage);
router.get('/export/riwayat/download', bookingController.downloadExportHistoryPDF);
router.get('/laporan/bulanan', bookingController.getMonthlyReport);
router.get('/laporan/bulanan/download', bookingController.downloadMonthlyReportPDF);

module.exports = router;