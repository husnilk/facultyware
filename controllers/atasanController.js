const db = require('../lib/db');

exports.index = (req, res) => {
    res.redirect('/atasan/cuti');
};

exports.indexCuti = async (req, res) => {
    try {
        const search = req.query.search || '';
        // Ubah: Default pencarian status untuk riwayat tidak boleh menampilkan pending
        let status = req.query.status || '';
        const leaveTypeId = req.query.leave_type_id || '';
        
        const page = parseInt(req.query.page) > 0 ? parseInt(req.query.page) : 1;
        const limit = 10;
        const offset = (page - 1) * limit;

        // --- 1. AMBIL DATA KHUSUS PENDING (MENUNGGU PERSETUJUAN) ---
        let pendingQueryStr = `
            SELECT lr.*, e.name AS employee_name, lt.name AS leave_type_name 
            FROM leave_requests lr
            JOIN employees e ON lr.employee_id = e.id
            JOIN leave_types lt ON lr.leave_type_id = lt.id
            WHERE lr.status = 'pending'
            ORDER BY lr.created_at ASC
        `;
        const [pendingRequests] = await db.execute(pendingQueryStr);

        // --- 2. AMBIL DATA RIWAYAT (HISTORY - BUKAN PENDING) ---
        let historyQueryStr = `
            SELECT lr.*, e.name AS employee_name, lt.name AS leave_type_name 
            FROM leave_requests lr
            JOIN employees e ON lr.employee_id = e.id
            JOIN leave_types lt ON lr.leave_type_id = lt.id
            WHERE lr.status != 'pending' 
        `;
        let countHistoryQueryStr = `
            SELECT COUNT(*) AS total
            FROM leave_requests lr
            JOIN employees e ON lr.employee_id = e.id
            JOIN leave_types lt ON lr.leave_type_id = lt.id
            WHERE lr.status != 'pending'
        `;
        
        let queryParams = [];
        let countParams = [];

        if (search) {
            historyQueryStr += ` AND e.name LIKE ?`;
            countHistoryQueryStr += ` AND e.name LIKE ?`;
            queryParams.push(`%${search}%`);
            countParams.push(`%${search}%`);
        }

        if (status && status !== 'pending') {
            historyQueryStr += ` AND lr.status = ?`;
            countHistoryQueryStr += ` AND lr.status = ?`;
            queryParams.push(status);
            countParams.push(status);
        }

        if (leaveTypeId) {
            historyQueryStr += ` AND lr.leave_type_id = ?`;
            countHistoryQueryStr += ` AND lr.leave_type_id = ?`;
            queryParams.push(leaveTypeId);
            countParams.push(leaveTypeId);
        }

        historyQueryStr += ` ORDER BY lr.created_at DESC LIMIT ? OFFSET ?`;
        queryParams.push(limit, offset);

        const [historyRequests] = await db.execute(historyQueryStr, queryParams);
        const [countResult] = await db.execute(countHistoryQueryStr, countParams);
        
        const totalData = countResult[0].total;
        const totalPages = Math.ceil(totalData / limit);

        const [leaveTypes] = await db.execute('SELECT id, name FROM leave_types ORDER BY name ASC');

        res.render('atasan/index', {
            title: 'Daftar Pengajuan Cuti Pegawai',
            pendingRequests,  // Kirim data pending secara terpisah
            historyRequests, // Kirim data riwayat secara terpisah
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

        const queryStr = `
            SELECT lr.*, 
                   e.name AS employee_name, e.employee_number AS employee_nip,
                   lt.name AS leave_type_name
            FROM leave_requests lr
            JOIN employees e ON lr.employee_id = e.id
            JOIN leave_types lt ON lr.leave_type_id = lt.id
            WHERE lr.id = ?
        `;

        const [requests] = await db.execute(queryStr, [id]);

        if (requests.length === 0) {
            return res.status(404).send("Data pengajuan cuti tidak ditemukan.");
        }

        const requestDetail = requests[0];

        let approvals = [];
        try {
            const approvalQuery = `
                SELECT la.*, la.notes AS comments, u.name AS approver_name
                FROM leave_approvals la
                LEFT JOIN users u ON la.approver_id = u.id
                WHERE la.leave_request_id = ?
                ORDER BY la.created_at ASC
            `;
            const [approvalResults] = await db.execute(approvalQuery, [id]);
            approvals = approvalResults;
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

// ... API Endpoint biarkan sama seperti sebelumnya
exports.apiGetCuti = async (req, res) => {
    try {
        const search = req.query.search || '';
        const status = req.query.status || '';
        const leaveTypeId = req.query.leave_type_id || '';

        let queryStr = `
            SELECT 
                lr.id,
                lr.employee_id,
                lr.leave_type_id,
                lr.start_date,
                lr.end_date,
                lr.total_days,
                lr.status,
                lr.submitted_at,
                lr.created_at,
                e.name AS employee_name,
                e.employee_number AS employee_number,
                lt.name AS leave_type_name
            FROM leave_requests lr
            JOIN employees e ON lr.employee_id = e.id
            JOIN leave_types lt ON lr.leave_type_id = lt.id
            WHERE 1=1
        `;
        let queryParams = [];

        if (search) {
            queryStr += ` AND (e.name LIKE ? OR e.employee_number LIKE ?)`;
            queryParams.push(`%${search}%`, `%${search}%`);
        }

        if (status) {
            queryStr += ` AND lr.status = ?`;
            queryParams.push(status);
        }

        if (leaveTypeId) {
            queryStr += ` AND lr.leave_type_id = ?`;
            queryParams.push(leaveTypeId);
        }

        queryStr += ` ORDER BY COALESCE(lr.submitted_at, lr.created_at) DESC`;

        const [requests] = await db.execute(queryStr, queryParams);

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

        const queryStr = `
            SELECT 
                lr.id, lr.employee_id, lr.leave_type_id, lr.start_date, lr.end_date, lr.total_days,
                lr.reason, lr.attachment, lr.address_leave, lr.contact_leave, lr.status, lr.submitted_at,
                lr.created_at, lr.approved_at, e.name AS employee_name, e.employee_number AS employee_number,
                lt.name AS leave_type_name
            FROM leave_requests lr
            JOIN employees e ON lr.employee_id = e.id
            JOIN leave_types lt ON lr.leave_type_id = lt.id
            WHERE lr.id = ?
        `;

        const [requests] = await db.execute(queryStr, [id]);

        if (requests.length === 0) return res.status(404).json({ success: false, message: "Data pengajuan cuti tidak ditemukan." });

        const requestDetail = requests[0];

        let approvals = [];
        try {
            const approvalQuery = `
                SELECT la.level, la.status, la.notes, la.action_date, la.created_at, u.name AS approver_name
                FROM leave_approvals la
                LEFT JOIN users u ON la.approver_id = u.id
                WHERE la.leave_request_id = ?
                ORDER BY la.created_at ASC
            `;
            const [approvalResults] = await db.execute(approvalQuery, [id]);
            approvals = approvalResults;
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