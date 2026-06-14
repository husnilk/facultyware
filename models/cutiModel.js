const db = require('../lib/db');

exports.getAllLeaveRequests = async (statusFilter) => {
    let query = `
        SELECT 
            lr.id, 
            e.name AS employee_name, 
            lt.name AS leave_type, 
            lr.start_date, 
            lr.end_date, 
            lr.total_days, 
            lr.status, 
            lr.submitted_at 
        FROM leave_requests lr
        JOIN employees e ON lr.employee_id = e.id
        JOIN leave_types lt ON lr.leave_type_id = lt.id
    `;
    
    const params = [];

    if (statusFilter && statusFilter !== 'all') {
        query += ` WHERE lr.status = ?`;
        params.push(statusFilter);
    }

    query += ` ORDER BY lr.submitted_at DESC`;

    const [rows] = await db.execute(query, params);
    return rows;
};

exports.getLeaveStatistics = async () => {
    const query = `
        SELECT 
            COUNT(id) AS total_requests,
            COUNT(CASE WHEN status = 'approved' THEN 1 END) AS total_approved,
            COUNT(CASE WHEN status = 'pending' THEN 1 END) AS total_pending,
            COUNT(CASE WHEN status = 'rejected' THEN 1 END) AS total_rejected
        FROM leave_requests
    `;
    const [rows] = await db.execute(query);
    return rows[0]; 
};

exports.getEmployeeLeaveStatistics = async (employeeId) => {
    const query = `
        SELECT 
            COUNT(id) AS total_requests,
            COUNT(CASE WHEN status = 'approved' THEN 1 END) AS total_approved,
            COUNT(CASE WHEN status = 'pending' THEN 1 END) AS total_pending,
            COUNT(CASE WHEN status = 'rejected' THEN 1 END) AS total_rejected
        FROM leave_requests
        WHERE employee_id = ?
    `;
    const [rows] = await db.execute(query, [employeeId]);
    return rows[0]; 
};

exports.getEmployeeLeaveRequests = async (employeeId, statusGroup = 'all') => {
    let query = `
        SELECT lr.*, lt.name as leave_type_name 
        FROM leave_requests lr
        JOIN leave_types lt ON lr.leave_type_id = lt.id
        WHERE lr.employee_id = ?
    `;
    let params = [employeeId];

    if (statusGroup === 'pending') {
        query += ` AND lr.status = 'pending'`;
    } else if (statusGroup === 'history') {
        query += ` AND lr.status IN ('approved', 'rejected', 'cancelled')`;
    }

    query += ` ORDER BY lr.submitted_at DESC`;
    
    const [rows] = await db.execute(query, params);
    return rows;
};

// --- FUNGSI BARU: Mengambil Riwayat Approval untuk Notifikasi Pegawai ---
exports.getEmployeeNotifications = async (employeeId) => {
    const query = `
        SELECT 
            la.id AS approval_id,
            la.status AS approval_status, 
            la.notes, 
            la.action_date, 
            la.level,
            lr.id AS leave_request_id,
            lr.start_date, 
            lr.end_date, 
            lt.name AS leave_type_name,
            u.name AS approver_name
        FROM leave_approvals la
        JOIN leave_requests lr ON la.leave_request_id = lr.id
        JOIN leave_types lt ON lr.leave_type_id = lt.id
        LEFT JOIN users u ON la.approver_id = u.id
        WHERE la.employee_id = ?
        ORDER BY COALESCE(la.action_date, la.created_at) DESC
    `;
    const [rows] = await db.execute(query, [employeeId]);
    return rows;
};

exports.getLeaveTypes = async () => {
    const [rows] = await db.execute('SELECT * FROM leave_types ORDER BY name ASC');
    return rows;
};

exports.createLeaveRequest = async (data) => {
    const { employee_id, leave_type_id, start_date, end_date, total_days, reason, address_leave, contact_leave, approver_id_id } = data;
    
    const [result] = await db.execute(
        `INSERT INTO leave_requests 
         (employee_id, leave_type_id, start_date, end_date, total_days, reason, address_leave, contact_leave, status, approver_id_id, submitted_at, created_at, updated_at) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?, NOW(), NOW(), NOW())`,
        [employee_id, leave_type_id, start_date, end_date, total_days, reason, address_leave, contact_leave, approver_id_id]
    );
    return result.insertId;
};

exports.getEmployeeLeaveRequestById = async (id, employeeId) => {
    const query = `
        SELECT lr.*, lt.name as leave_type_name 
        FROM leave_requests lr
        JOIN leave_types lt ON lr.leave_type_id = lt.id
        WHERE lr.id = ? AND lr.employee_id = ?
    `;
    const [rows] = await db.execute(query, [id, employeeId]);
    return rows.length > 0 ? rows[0] : null;
};

exports.deleteLeaveRequest = async (id, employeeId) => {
    const [result] = await db.execute(
        "DELETE FROM leave_requests WHERE id = ? AND employee_id = ? AND status = 'pending'",
        [id, employeeId]
    );
    return result.affectedRows > 0;
};

exports.updateLeaveRequest = async (id, employeeId, data) => {
    let query = `UPDATE leave_requests SET leave_type_id = ?, start_date = ?, end_date = ?, total_days = ?, reason = ?, address_leave = ?, contact_leave = ?, updated_at = NOW() WHERE id = ? AND employee_id = ? AND status = 'pending'`;
    let params = [data.leave_type_id, data.start_date, data.end_date, data.total_days, data.reason, data.address_leave, data.contact_leave, id, employeeId];
    
    const [result] = await db.execute(query, params);
    return result.affectedRows > 0;
};

exports.getPendingLeaveRequestsLvl2 = async (search) => {
    let queryStr = `
        SELECT lr.id, lr.employee_id, lr.leave_type_id, lr.start_date, lr.end_date, lr.total_days, 
               lr.reason, lr.attachment, lr.address_leave, lr.contact_leave, lr.status, 
               lr.submitted_at, lr.created_at, lr.approved_at,
               e.name AS employee_name, e.employee_number AS employee_number,
               lt.name AS leave_type_name
        FROM leave_requests lr
        JOIN employees e ON lr.employee_id = e.id
        JOIN leave_types lt ON lr.leave_type_id = lt.id
        WHERE lr.status = 'pending'
    `;
    let queryParams = [];
    if (search) {
        queryStr += ` AND (e.name LIKE ? OR e.employee_number LIKE ?)`;
        queryParams.push(`%${search}%`, `%${search}%`);
    }
    queryStr += ` ORDER BY COALESCE(lr.submitted_at, lr.created_at) DESC`;
    const [rows] = await db.execute(queryStr, queryParams);
    return rows;
};

exports.getLeaveRequestDetailLvl2 = async (id) => {
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
    const [rows] = await db.execute(queryStr, [id]);
    return rows.length > 0 ? rows[0] : null;
};

exports.getLeaveApprovals = async (leaveRequestId) => {
    const query = `
        SELECT la.level, la.status, la.notes, la.action_date, la.created_at, u.name AS approver_name
        FROM leave_approvals la
        LEFT JOIN users u ON la.approver_id = u.id
        WHERE la.leave_request_id = ?
        ORDER BY la.created_at ASC
    `;
    const [rows] = await db.execute(query, [leaveRequestId]);
    return rows;
};

exports.processLeaveApprovalLvl2 = async (id, approverId, status, notes) => {
    const conn = await db.getConnection();
    try {
        await conn.beginTransaction();
        const [requests] = await conn.execute(`SELECT * FROM leave_requests WHERE id = ? FOR UPDATE`, [id]);
        if (requests.length === 0) throw new Error("NOT_FOUND");
        const leaveRequest = requests[0];
        if (leaveRequest.status !== 'pending') throw new Error("ALREADY_PROCESSED");
        await conn.execute(`
            UPDATE leave_requests
            SET status = ?, approved_at = NOW(), approver_id = ?, approver_id_id = ?, updated_at = NOW()
            WHERE id = ?
        `, [status, approverId, approverId, id]);
        await conn.execute(`
            INSERT INTO leave_approvals
            (leave_request_id, approver_id, level, status, notes, action_date, employee_id, created_at, updated_at)
            VALUES (?, ?, 2, ?, ?, NOW(), ?, NOW(), NOW())
        `, [id, approverId, status, notes, leaveRequest.employee_id]);
        await conn.commit();
        return true;
    } catch (error) {
        await conn.rollback();
        throw error;
    } finally {
        conn.release();
    }
};

exports.getRiwayatApprovalPdfDataLvl2 = async () => {
    const queryStr = `
        SELECT lr.id, lr.employee_id, lr.leave_type_id, lr.start_date, lr.end_date, lr.total_days, 
               lr.reason, lr.status, lr.submitted_at, lr.approved_at, lr.created_at,
               e.name AS employee_name, e.employee_number AS employee_number,
               lt.name AS leave_type_name,
               la.level AS approval_level, la.status AS approval_status, la.notes AS approval_notes, 
               la.action_date AS approval_action_date, u.name AS approver_name
        FROM leave_requests lr
        JOIN employees e ON lr.employee_id = e.id
        JOIN leave_types lt ON lr.leave_type_id = lt.id
        LEFT JOIN leave_approvals la ON la.leave_request_id = lr.id AND la.level = 2
        LEFT JOIN users u ON la.approver_id = u.id
        WHERE lr.status IN ('approved', 'rejected')
        ORDER BY COALESCE(la.action_date, lr.approved_at, lr.created_at) DESC
    `;
    const [rows] = await db.execute(queryStr);
    return rows;
};