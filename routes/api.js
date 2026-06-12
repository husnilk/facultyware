const express = require('express');
const router = express.Router();
const cutiModel = require('../models/cutiModel');

// Middleware auth khusus API (return JSON bukan redirect)
const apiAuth = (req, res, next) => {
    if (req.session && req.session.user) {
        return next();
    }
    return res.status(401).json({
        success: false,
        message: 'Unauthorized. Silakan login terlebih dahulu.'
    });
};

/**
 * GET /api/cuti
 * List riwayat pengajuan cuti pegawai yang sedang login
 * 
 * Query params:
 * - search  : string (opsional) - cari berdasarkan jenis cuti atau alasan
 * - status  : string (opsional) - filter: pending | approved | rejected
 * - sort    : string (opsional) - urutan: DESC (default) | ASC
 * - page    : number (opsional) - halaman pagination (default: 1)
 * - limit   : number (opsional) - jumlah data per halaman (default: 10)
 */
router.get('/cuti', apiAuth, async (req, res) => {
    const employeeId = req.session.user.id;

    const search = req.query.search || '';
    const status = req.query.status || '';
    const sort   = req.query.sort || 'DESC';
    const page   = parseInt(req.query.page) || 1;
    const limit  = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    try {
        const totalRows  = await cutiModel.getLeaveRequestsCount(employeeId, search, status);
        const totalPages = Math.ceil(totalRows / limit);
        const requests   = await cutiModel.getLeaveRequests(employeeId, search, status, sort, limit, offset);

        return res.status(200).json({
            success: true,
            data: requests,
            pagination: {
                total_data : totalRows,
                total_pages: totalPages,
                current_page: page,
                per_page: limit
            }
        });
    } catch (error) {
        console.error('API Error GET /cuti:', error);
        return res.status(500).json({
            success: false,
            message: 'Terjadi kesalahan pada server.',
            error: error.message
        });
    }
});

module.exports = router;
