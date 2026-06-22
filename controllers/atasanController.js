const cutiModel = require('../models/cutiModel');

exports.index = (req, res) => {
    res.redirect('/atasan/cuti');
};

exports.indexCuti = async (req, res) => {
    try {
        const search = req.query.search || '';
        let status = req.query.status || '';
        const leaveTypeId = req.query.leave_type_id || '';
        
        const page = parseInt(req.query.page) > 0 ? parseInt(req.query.page) : 1;
        const limit = 10;
        const offset = (page - 1) * limit;

        // Ambil data melalui Model (Bebas SQL)
        const pendingRequests = await cutiModel.getPendingLeaveRequestsLvl1();
        const historyData = await cutiModel.getHistoryLeaveRequestsLvl1(search, status, leaveTypeId, limit, offset);
        const leaveTypes = await cutiModel.getLeaveTypes();

        const historyRequests = historyData.requests;
        const totalPages = Math.ceil(historyData.total / limit);

        res.render('atasan/index', {
            title: 'Daftar Pengajuan Cuti Pegawai',
            pendingRequests,
            historyRequests,
            leaveTypes,
            search,
            status,
            leaveTypeId,
            page,
            totalPages,
            user: req.session.user
        });

    } catch (error) {
        console.error("Error at indexCuti:", error);
        res.status(500).send("Terjadi kesalahan saat mengambil data pengajuan cuti.");
    }
};

exports.detailCuti = async (req, res) => {
    try {
        const id = parseInt(req.params.id, 10);

        if (isNaN(id)) {
            return res.status(400).send("ID pengajuan cuti tidak valid.");
        }

        // Ambil data detail melalui Model
        const requestDetail = await cutiModel.getLeaveRequestDetailLvl1(id);

        if (!requestDetail) {
            return res.status(404).send("Data pengajuan cuti tidak ditemukan.");
        }

        let approvals = [];
        try {
            approvals = await cutiModel.getLeaveApprovals(id);
        } catch (err) {
            console.warn("Tabel leave_approvals belum tersedia atau gagal diakses:", err.message);
        }

        res.render('atasan/detail', {
            title: 'Detail Pengajuan Cuti',
            request: requestDetail,
            approvals: approvals,
            user: req.session.user
        });

    } catch (error) {
        console.error("Error at detailCuti:", error);
        res.status(500).send("Terjadi kesalahan saat mengambil detail pengajuan cuti.");
    }
};

// --- API Endpoints ---
exports.apiGetCuti = async (req, res) => {
    try {
        const search = req.query.search || '';
        const status = req.query.status || '';
        const leaveTypeId = req.query.leave_type_id || '';

        // Ambil data API melalui Model
        const requests = await cutiModel.getApiLeaveRequests(search, status, leaveTypeId);

        res.json({
            success: true,
            message: "Data pengajuan cuti berhasil diambil.",
            filters: { search, status, leave_type_id: leaveTypeId },
            total: requests.length,
            data: requests
        });
    } catch (error) {
        console.error("Error at apiGetCuti:", error);
        res.status(500).json({ success: false, message: "Terjadi kesalahan server.", error: error.message });
    }
};

exports.apiGetDetailCuti = async (req, res) => {
    try {
        const id = parseInt(req.params.id, 10);
        if (isNaN(id)) return res.status(400).json({ success: false, message: "ID pengajuan cuti tidak valid." });

        // Gunakan fungsi detail model yang sama untuk API
        const requestDetail = await cutiModel.getLeaveRequestDetailLvl1(id);

        if (!requestDetail) return res.status(404).json({ success: false, message: "Data pengajuan cuti tidak ditemukan." });

        let approvals = [];
        try {
            approvals = await cutiModel.getLeaveApprovals(id);
        } catch (err) {
            console.warn("Error getting approvals:", err.message);
        }

        requestDetail.approvals = approvals;

        res.json({ success: true, message: "Detail pengajuan cuti berhasil diambil.", data: requestDetail });
    } catch (error) {
        console.error("Error at apiGetDetailCuti:", error);
        res.status(500).json({ success: false, message: "Terjadi kesalahan server.", error: error.message });
    }
};