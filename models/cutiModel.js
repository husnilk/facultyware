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