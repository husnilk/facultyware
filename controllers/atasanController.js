const db = require('../lib/db');

exports.index = (req, res) => {
    // Redirect halaman default ke /atasan/cuti
    res.redirect('/atasan/cuti');
};

// Fungsi untuk menampilkan daftar pengajuan cuti beserta fitur search, filter, dan pagination
exports.indexCuti = async (req, res) => {
    try {
        // Ambil input parameter dari URL (query string)
        const search = req.query.search || '';
        const status = req.query.status || '';
        const leaveTypeId = req.query.leave_type_id || '';
        
        // Ambil parameter halaman, pastikan minimal 1
        const page = parseInt(req.query.page) > 0 ? parseInt(req.query.page) : 1;
        
        // Atur limit per halaman menjadi 10 data
        const limit = 10;
        const offset = (page - 1) * limit;

        // Siapkan query database menggunakan mysql2 (Prepared Statement)
        // Kita join dengan employees untuk dapatkan nama, dan leave_types untuk nama tipe cuti
        let queryStr = `
            SELECT lr.*, e.name AS employee_name, lt.name AS leave_type_name 
            FROM leave_requests lr
            JOIN employees e ON lr.employee_id = e.id
            JOIN leave_types lt ON lr.leave_type_id = lt.id
            WHERE 1=1
        `;
        let countQueryStr = `
            SELECT COUNT(*) AS total
            FROM leave_requests lr
            JOIN employees e ON lr.employee_id = e.id
            JOIN leave_types lt ON lr.leave_type_id = lt.id
            WHERE 1=1
        `;
        
        let queryParams = [];
        let countParams = [];

        // 1. Filter: Search Nama Pegawai
        if (search) {
            queryStr += ` AND e.name LIKE ?`;
            countQueryStr += ` AND e.name LIKE ?`;
            queryParams.push(`%${search}%`);
            countParams.push(`%${search}%`);
        }

        // 2. Filter: Status Cuti
        if (status) {
            queryStr += ` AND lr.status = ?`;
            countQueryStr += ` AND lr.status = ?`;
            queryParams.push(status);
            countParams.push(status);
        }

        // 3. Filter: Jenis Cuti
        if (leaveTypeId) {
            queryStr += ` AND lr.leave_type_id = ?`;
            countQueryStr += ` AND lr.leave_type_id = ?`;
            queryParams.push(leaveTypeId);
            countParams.push(leaveTypeId);
        }

        // Pengurutan dan Pagination menggunakan LIMIT & OFFSET
        queryStr += ` ORDER BY lr.created_at DESC LIMIT ? OFFSET ?`;
        
        // Karena LIMIT dan OFFSET memerlukan angka (bukan string string interpolation),
        // mysql2 secara native mengubah type integer ini dengan baik.
        queryParams.push(limit, offset);

        // Eksekusi Query menggunakan mysql2 connection pool
        const [requests] = await db.execute(queryStr, queryParams);
        const [countResult] = await db.execute(countQueryStr, countParams);
        
        const totalData = countResult[0].total;
        const totalPages = Math.ceil(totalData / limit);

        // Ambil data tabel leave_types untuk dropdown opsi jenis cuti
        const [leaveTypes] = await db.execute('SELECT id, name FROM leave_types ORDER BY name ASC');

        // Render ke file EJS dengan mengirim semua data yang diperlukan
        res.render('atasan/index', {
            title: 'Daftar Pengajuan Cuti Pegawai',
            requests,
            leaveTypes,
            search,
            status,
            leaveTypeId,
            page,
            totalPages,
            user: req.session.user // Berisi session yang sudah ada, misal { id, name, role }
        });

    } catch (error) {
        console.error("Error at indexCuti:", error);
        // Error handling aman ke user (tidak mengekspos error asli)
        res.status(500).send("Terjadi kesalahan saat mengambil data pengajuan cuti.");
    }
};

// Fungsi untuk menampilkan detail pengajuan cuti pegawai (Tahap 2)
exports.detailCuti = async (req, res) => {
    try {
        const id = parseInt(req.params.id, 10);

        if (isNaN(id)) {
            return res.status(400).send("ID pengajuan cuti tidak valid.");
        }

        // Ambil detail pengajuan cuti (Prepared Statement)
        // Keterangan: e.email tidak ada di tabel employees, e.nip diganti ke e.employee_number sesuai schema asli.
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
            // Tampilkan pesan aman jika data tidak ditemukan (misal halaman 404)
            return res.status(404).send("Data pengajuan cuti tidak ditemukan.");
        }

        const requestDetail = requests[0];

        // Ambil riwayat approval jika ada
        let approvals = [];
        try {
            // Keterangan: Menggunakan la.notes sebagai comments sesuai dengan schema tabel leave_approvals
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

        // Render EJS Detail
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