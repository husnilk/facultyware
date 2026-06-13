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

    // Jika filter status ada dan bukan 'all', tambahkan WHERE clause
    if (statusFilter && statusFilter !== 'all') {
        query += ` WHERE lr.status = ?`;
        params.push(statusFilter);
    }

    query += ` ORDER BY lr.submitted_at DESC`;

    const [rows] = await db.execute(query, params);
    return rows;
};

// --- FUNGSI BARU UNTUK STATISTIK ---
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
    return rows[0]; // Mengembalikan satu baris data rekapitulasi
};

// --- FUNGSI BARU UNTUK PEGAWAI ---
exports.getEmployeeLeaveRequests = async (employeeId) => {
    const query = `
        SELECT lr.*, lt.name as leave_type_name 
        FROM leave_requests lr
        JOIN leave_types lt ON lr.leave_type_id = lt.id
        WHERE lr.employee_id = ?
        ORDER BY lr.submitted_at DESC
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