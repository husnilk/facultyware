const db = require('../lib/db');

exports.index = (req, res) => {
    res.redirect('/atasan-lvl2/cuti/pending');
};

exports.pendingCuti = async (req, res) => {
    try {
        const search = req.query.search || '';
        
        let queryStr = `
            SELECT lr.id, lr.start_date, lr.end_date, lr.total_days, lr.status, lr.submitted_at, lr.created_at,
                   e.name AS employee_name, e.employee_number AS employee_number,
                   lt.name AS leave_type_name
            FROM leave_requests lr
            JOIN employees e ON lr.employee_id = e.id
            JOIN leave_types lt ON lr.leave_type_id = lt.id
            WHERE lr.status = 'pending'
        `;
        
        let queryParams = [];

        if (search) {
            queryStr += ` AND e.name LIKE ?`;
            queryParams.push(`%${search}%`);
        }

        queryStr += ` ORDER BY COALESCE(lr.submitted_at, lr.created_at) DESC`;

        const [requests] = await db.execute(queryStr, queryParams);

        res.render('atasanLvl2/index', {
            title: 'Pengajuan Cuti Menunggu Persetujuan',
            requests,
            search,
            success: req.query.success || null,
            user: req.session.user
        });
    } catch (error) {
        console.error("Error at pendingCuti:", error);
        res.status(500).send("Terjadi kesalahan saat mengambil data pending.");
    }
};

exports.detailCuti = async (req, res) => {
    try {
        const id = parseInt(req.params.id, 10);
        if (isNaN(id)) {
            return res.status(400).send("ID pengajuan cuti tidak valid.");
        }

        const queryStr = `
            SELECT lr.id, lr.employee_id, lr.leave_type_id, lr.start_date, lr.end_date, 
                   lr.total_days, lr.reason, lr.attachment, lr.address_leave, lr.contact_leave, 
                   lr.status, lr.submitted_at, lr.created_at, lr.approved_at,
                   e.name AS employee_name, e.employee_number AS employee_number,
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

        // Riwayat approval
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
            console.warn("Tabel leave_approvals belum tersedia:", err.message);
        }

        res.render('atasanLvl2/detail', {
            title: 'Detail Pengajuan Cuti',
            request: requestDetail,
            approvals: approvals,
            error: req.query.error || null,
            user: req.session.user
        });
    } catch (error) {
        console.error("Error at detailCuti:", error);
        res.status(500).send("Terjadi kesalahan saat mengambil detail pengajuan cuti.");
    }
};

exports.approveCuti = async (req, res) => {
    console.log('POST approveCuti terpanggil, id:', req.params.id);
    let conn;
    try {
        const id = parseInt(req.params.id, 10);
        if (isNaN(id)) return res.redirect('/atasan-lvl2/cuti/pending');
        
        const userId = req.session.user.id;
        
        // Cari employee approver
        const [empRows] = await db.execute(`SELECT id FROM employees WHERE id = ?`, [userId]);
        if (empRows.length === 0) {
            return res.redirect(`/atasan-lvl2/cuti/${id}?error=approver_not_found`);
        }
        const approverEmployeeId = empRows[0].id;
        
        conn = await db.getConnection();
        await conn.beginTransaction();
        
        const [requests] = await conn.execute(`SELECT * FROM leave_requests WHERE id = ? FOR UPDATE`, [id]);
        if (requests.length === 0) {
            await conn.rollback();
            return res.status(404).send("Data tidak ditemukan.");
        }
        
        const leaveRequest = requests[0];
        if (leaveRequest.status !== 'pending') {
            await conn.rollback();
            return res.redirect(`/atasan-lvl2/cuti/${id}?error=already_processed`);
        }
        
        await conn.execute(`
            UPDATE leave_requests
            SET status = 'approved',
                approved_at = NOW(),
                approver_id = ?,
                approver_id_id = ?,
                updated_at = NOW()
            WHERE id = ?
        `, [approverEmployeeId, approverEmployeeId, id]);
        
        await conn.execute(`
            INSERT INTO leave_approvals
            (leave_request_id, approver_id, level, status, notes, action_date, employee_id, created_at, updated_at)
            VALUES (?, ?, 2, 'approved', ?, NOW(), ?, NOW(), NOW())
        `, [id, userId, 'Pengajuan disetujui oleh Atasan Level 2.', leaveRequest.employee_id]);
        
        await conn.commit();
        res.redirect('/atasan-lvl2/cuti/pending?success=approved');
        
    } catch (error) {
        if (conn) await conn.rollback();
        console.error("Error at approveCuti:", error);
        res.status(500).send("Terjadi kesalahan sistem.");
    } finally {
        if (conn) conn.release();
    }
};

exports.rejectCuti = async (req, res) => {
    console.log('POST rejectCuti terpanggil, id:', req.params.id);
    let conn;
    try {
        const id = parseInt(req.params.id, 10);
        if (isNaN(id)) return res.redirect('/atasan-lvl2/cuti/pending');
        
        const notes = (req.body.notes || '').trim();
        if (!notes) {
            return res.redirect(`/atasan-lvl2/cuti/${id}?error=notes_required`);
        }
        
        const userId = req.session.user.id;
        
        // Cari employee approver
        const [empRows] = await db.execute(`SELECT id FROM employees WHERE id = ?`, [userId]);
        if (empRows.length === 0) {
            return res.redirect(`/atasan-lvl2/cuti/${id}?error=approver_not_found`);
        }
        const approverEmployeeId = empRows[0].id;
        
        conn = await db.getConnection();
        await conn.beginTransaction();
        
        const [requests] = await conn.execute(`SELECT * FROM leave_requests WHERE id = ? FOR UPDATE`, [id]);
        if (requests.length === 0) {
            await conn.rollback();
            return res.status(404).send("Data tidak ditemukan.");
        }
        
        const leaveRequest = requests[0];
        if (leaveRequest.status !== 'pending') {
            await conn.rollback();
            return res.redirect(`/atasan-lvl2/cuti/${id}?error=already_processed`);
        }
        
        await conn.execute(`
            UPDATE leave_requests
            SET status = 'rejected',
                approved_at = NOW(),
                approver_id = ?,
                approver_id_id = ?,
                updated_at = NOW()
            WHERE id = ?
        `, [approverEmployeeId, approverEmployeeId, id]);
        
        await conn.execute(`
            INSERT INTO leave_approvals
            (leave_request_id, approver_id, level, status, notes, action_date, employee_id, created_at, updated_at)
            VALUES (?, ?, 2, 'rejected', ?, NOW(), ?, NOW(), NOW())
        `, [id, userId, notes, leaveRequest.employee_id]);
        
        await conn.commit();
        res.redirect('/atasan-lvl2/cuti/pending?success=rejected');
        
    } catch (error) {
        if (conn) await conn.rollback();
        console.error("Error at rejectCuti:", error);
        res.status(500).send("Terjadi kesalahan sistem.");
    } finally {
        if (conn) conn.release();
    }
};