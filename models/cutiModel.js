const db = require('../lib/db');

// Mengambil semua jenis cuti yang tersedia
exports.getLeaveTypes = async () => {
    const [rows] = await db.execute('SELECT * FROM leave_types ORDER BY name ASC');
    return rows;
};

// Mengambil sisa kuota cuti pegawai untuk tahun tertentu
exports.getLeaveBalance = async (employeeId, leaveTypeId, year) => {
    const [rows] = await db.execute(
        'SELECT * FROM leave_balances WHERE employee_id = ? AND leave_type_id = ? AND year = ?',
        [employeeId, leaveTypeId, year]
    );
    return rows.length > 0 ? rows[0] : null;
};

// Mengambil semua saldo kuota cuti pegawai
exports.getLeaveBalances = async (employeeId, year) => {
    const [rows] = await db.execute(
        `SELECT lb.*, lt.name as leave_type_name 
         FROM leave_balances lb
         JOIN leave_types lt ON lb.leave_type_id = lt.id
         WHERE lb.employee_id = ? AND lb.year = ?`,
        [employeeId, year]
    );
    return rows;
};

// Mengambil riwayat pengajuan cuti pegawai (dengan search, filter status, sort, pagination)
exports.getLeaveRequests = async (employeeId, search = '', status = '', sort = 'DESC', limit = 10, offset = 0) => {
    let query = `
        SELECT lr.*, lt.name as leave_type_name 
        FROM leave_requests lr
        JOIN leave_types lt ON lr.leave_type_id = lt.id
        WHERE lr.employee_id = ?
    `;
    const params = [employeeId];

    if (search) {
        query += ' AND (lt.name LIKE ? OR lr.reason LIKE ?)';
        params.push(`%${search}%`, `%${search}%`);
    }

    if (status) {
        query += ' AND lr.status = ?';
        params.push(status);
    }

    // Sort order (DESC / ASC)
    const order = sort.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';
    query += ` ORDER BY lr.submitted_at ${order}, lr.id ${order}`;

    // Pagination - interpolasi langsung untuk hindari ER_WRONG_ARGUMENTS
    query += ` LIMIT ${parseInt(limit)} OFFSET ${parseInt(offset)}`;

    const [rows] = await db.execute(query, params);
    return rows;
};

// Mengambil total baris pengajuan cuti pegawai (untuk menghitung total halaman pagination)
exports.getLeaveRequestsCount = async (employeeId, search = '', status = '') => {
    let query = `
        SELECT COUNT(*) as count 
        FROM leave_requests lr
        JOIN leave_types lt ON lr.leave_type_id = lt.id
        WHERE lr.employee_id = ?
    `;
    const params = [employeeId];

    if (search) {
        query += ' AND (lt.name LIKE ? OR lr.reason LIKE ?)';
        params.push(`%${search}%`, `%${search}%`);
    }

    if (status) {
        query += ' AND lr.status = ?';
        params.push(status);
    }

    const [rows] = await db.execute(query, params);
    return rows[0].count;
};

// Mengambil detail pengajuan cuti
exports.getLeaveRequestById = async (id, employeeId) => {
    const query = `
        SELECT lr.*, lt.name as leave_type_name, 
               app.name as approver_name, 
               la.notes as approver_notes, 
               la.action_date as approval_date
        FROM leave_requests lr
        JOIN leave_types lt ON lr.leave_type_id = lt.id
        LEFT JOIN leave_approvals la ON lr.id = la.leave_request_id
        LEFT JOIN employees app ON la.approver_id = app.id
        WHERE lr.id = ? AND lr.employee_id = ?
        ORDER BY la.id DESC LIMIT 1
    `;
    const [rows] = await db.execute(query, [id, employeeId]);
    return rows.length > 0 ? rows[0] : null;
};

// Membuat pengajuan cuti baru
exports.createLeaveRequest = async (data) => {
    const { employee_id, leave_type_id, start_date, end_date, total_days, reason, approver_id_id } = data;
    const [result] = await db.execute(
        `INSERT INTO leave_requests 
         (employee_id, leave_type_id, start_date, end_date, total_days, reason, status, approver_id_id, submitted_at, created_at, updated_at) 
         VALUES (?, ?, ?, ?, ?, ?, 'pending', ?, NOW(), NOW(), NOW())`,
        [employee_id, leave_type_id, start_date, end_date, total_days, reason, approver_id_id]
    );
    return result.insertId;
};

// Mengubah pengajuan cuti yang masih pending
exports.updateLeaveRequest = async (id, employeeId, data) => {
    const { leave_type_id, start_date, end_date, total_days, reason } = data;
    const [result] = await db.execute(
        `UPDATE leave_requests 
         SET leave_type_id = ?, start_date = ?, end_date = ?, total_days = ?, reason = ?, updated_at = NOW() 
         WHERE id = ? AND employee_id = ? AND status = 'pending'`,
        [leave_type_id, start_date, end_date, total_days, reason, id, employeeId]
    );
    return result.affectedRows > 0;
};

// Menghapus pengajuan cuti yang masih pending (hard delete sesuai schema)
exports.deleteLeaveRequest = async (id, employeeId) => {
    // Karena tabel leave_requests tidak memiliki kolom soft-delete (seperti deleted_at), 
    // maka kita gunakan hard delete langsung ke baris database
    const [result] = await db.execute(
        "DELETE FROM leave_requests WHERE id = ? AND employee_id = ? AND status = 'pending'",
        [id, employeeId]
    );
    return result.affectedRows > 0;
};

// Mengambil semua notifikasi untuk pegawai
exports.getNotifications = async (userId) => {
    const [rows] = await db.execute(
        'SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC',
        [userId]
    );
    return rows;
};

// Mengambil jumlah notifikasi belum dibaca
exports.getUnreadNotificationsCount = async (userId) => {
    const [rows] = await db.execute(
        'SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND is_read = 0',
        [userId]
    );
    return rows[0].count;
};

// Tandai notifikasi sudah dibaca
exports.markNotificationAsRead = async (id, userId) => {
    const [result] = await db.execute(
        'UPDATE notifications SET is_read = 1, updated_at = NOW() WHERE id = ? AND user_id = ?',
        [id, userId]
    );
    return result.affectedRows > 0;
};

// Menyimpan notifikasi baru
exports.createNotification = async (userId, title, message) => {
    const [result] = await db.execute(
        'INSERT INTO notifications (user_id, title, message, is_read, created_at, updated_at) VALUES (?, ?, ?, 0, NOW(), NOW())',
        [userId, title, message]
    );
    return result.insertId;
};

// Simulasi Aksi Atasan (Persetujuan/Penolakan) untuk keperluan testing notifikasi
exports.simulateApproval = async (requestId, status, notes, approverId) => {
    // 1. Update status leave_request
    const [updateRes] = await db.execute(
        'UPDATE leave_requests SET status = ?, approver_id = ?, approved_at = NOW(), updated_at = NOW() WHERE id = ?',
        [status, approverId, requestId]
    );

    if (updateRes.affectedRows === 0) return false;

    // 2. Insert record ke leave_approvals
    await db.execute(
        `INSERT INTO leave_approvals 
         (leave_request_id, approver_id, level, status, notes, action_date, employee_id, created_at, updated_at) 
         VALUES (?, ?, 1, ?, ?, NOW(), ?, NOW(), NOW())`,
        [requestId, approverId, status, notes, approverId]
    );

    // 3. Ambil data cuti untuk mengetahui employee_id (untuk notifikasi)
    const [lrRows] = await db.execute('SELECT employee_id, leave_type_id FROM leave_requests WHERE id = ?', [requestId]);
    if (lrRows.length === 0) return true;
    
    const employeeId = lrRows[0].employee_id;
    const leaveTypeId = lrRows[0].leave_type_id;

    // 4. Jika disetujui, update saldo (leave_balances) - kurangi sisa kuota dengan total_days
    if (status === 'approved') {
        const [lrDetail] = await db.execute('SELECT total_days FROM leave_requests WHERE id = ?', [requestId]);
        const days = lrDetail[0].total_days;
        
        await db.execute(
            'UPDATE leave_balances SET used = used + ?, remaining = remaining - ? WHERE employee_id = ? AND leave_type_id = ? AND year = 2026',
            [days, days, employeeId, leaveTypeId]
        );
    }

    // 5. Kirim notifikasi
    const statusText = status === 'approved' ? 'disetujui' : 'ditolak';
    const title = `Pengajuan Cuti ${status === 'approved' ? 'Disetujui' : 'Ditolak'}`;
    let message = `Cuti Anda telah ${statusText}`;
    if (status === 'rejected' && notes) {
        message += `. Komentar Atasan: ${notes}`;
    }

    // Masukkan notifikasi ke database
    await exports.createNotification(employeeId, title, message);
    return true;
};

// Mengambil SEMUA riwayat pengajuan cuti pegawai (tanpa pagination, untuk export)
exports.getAllLeaveRequestsForExport = async (employeeId, search = '', status = '') => {
    let query = `
        SELECT lr.*, lt.name as leave_type_name,
               la.notes as approver_notes
        FROM leave_requests lr
        JOIN leave_types lt ON lr.leave_type_id = lt.id
        LEFT JOIN leave_approvals la ON lr.id = la.leave_request_id
        WHERE lr.employee_id = ?
    `;
    const params = [employeeId];

    if (search) {
        query += ' AND (lt.name LIKE ? OR lr.reason LIKE ?)';
        params.push(`%${search}%`, `%${search}%`);
    }

    if (status) {
        query += ' AND lr.status = ?';
        params.push(status);
    }

    query += ' ORDER BY lr.submitted_at DESC, lr.id DESC';

    const [rows] = await db.execute(query, params);
    return rows;
};
