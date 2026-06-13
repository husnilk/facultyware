const db = require('../lib/db');
const PDFDocument = require('pdfkit');

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

exports.apiGetPendingCuti = async (req, res) => {
    try {
        const search = req.query.search || '';

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
            WHERE lr.status = 'pending'
        `;
        let queryParams = [];

        if (search) {
            queryStr += ` AND (e.name LIKE ? OR e.employee_number LIKE ?)`;
            queryParams.push(`%${search}%`, `%${search}%`);
        }

        queryStr += ` ORDER BY COALESCE(lr.submitted_at, lr.created_at) DESC`;

        const [requests] = await db.execute(queryStr, queryParams);

        res.json({
            success: true,
            message: "Data pengajuan cuti pending berhasil diambil.",
            filters: {
                search: search
            },
            total: requests.length,
            data: requests
        });
    } catch (error) {
        console.error("Error at apiGetPendingCuti:", error);
        res.status(500).json({
            success: false,
            message: "Terjadi kesalahan server.",
            error: error.message
        });
    }
};

exports.apiGetDetailCuti = async (req, res) => {
    try {
        const id = parseInt(req.params.id, 10);

        if (isNaN(id)) {
            return res.status(400).json({
                success: false,
                message: "ID pengajuan cuti tidak valid."
            });
        }

        const queryStr = `
            SELECT 
                lr.id,
                lr.employee_id,
                lr.leave_type_id,
                lr.start_date,
                lr.end_date,
                lr.total_days,
                lr.reason,
                lr.attachment,
                lr.address_leave,
                lr.contact_leave,
                lr.status,
                lr.submitted_at,
                lr.created_at,
                lr.approved_at,
                e.name AS employee_name,
                e.employee_number AS employee_number,
                lt.name AS leave_type_name
            FROM leave_requests lr
            JOIN employees e ON lr.employee_id = e.id
            JOIN leave_types lt ON lr.leave_type_id = lt.id
            WHERE lr.id = ?
        `;

        const [requests] = await db.execute(queryStr, [id]);

        if (requests.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Data pengajuan cuti tidak ditemukan."
            });
        }

        const requestDetail = requests[0];

        let approvals = [];
        try {
            const approvalQuery = `
                SELECT 
                    la.level,
                    la.status,
                    la.notes,
                    la.action_date,
                    la.created_at,
                    u.name AS approver_name
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

        res.json({
            success: true,
            message: "Detail pengajuan cuti berhasil diambil.",
            data: requestDetail
        });
    } catch (error) {
        console.error("Error at apiGetDetailCuti:", error);
        res.status(500).json({
            success: false,
            message: "Terjadi kesalahan server.",
            error: error.message
        });
    }
};

const formatDatePdf = (dateValue) => {
    if (!dateValue) return '-';

    return new Date(dateValue).toLocaleDateString('id-ID', {
        day: '2-digit',
        month: 'long',
        year: 'numeric'
    });
};

const getPrintedDate = () => {
    return new Date().toLocaleString('id-ID', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
};

const getRiwayatApprovalPdfData = async () => {
    const queryStr = `
        SELECT 
            lr.id,
            lr.employee_id,
            lr.leave_type_id,
            lr.start_date,
            lr.end_date,
            lr.total_days,
            lr.reason,
            lr.status,
            lr.submitted_at,
            lr.approved_at,
            lr.created_at,

            e.name AS employee_name,
            e.employee_number AS employee_number,

            lt.name AS leave_type_name,

            la.level AS approval_level,
            la.status AS approval_status,
            la.notes AS approval_notes,
            la.action_date AS approval_action_date,

            u.name AS approver_name
        FROM leave_requests lr
        JOIN employees e ON lr.employee_id = e.id
        JOIN leave_types lt ON lr.leave_type_id = lt.id
        LEFT JOIN leave_approvals la 
            ON la.leave_request_id = lr.id 
            AND la.level = 2
        LEFT JOIN users u ON la.approver_id = u.id
        WHERE lr.status IN ('approved', 'rejected')
        ORDER BY COALESCE(la.action_date, lr.approved_at, lr.created_at) DESC
    `;

    const [rows] = await db.execute(queryStr);
    return rows;
};

exports.exportRiwayatPdf = async (req, res) => {
    try {
        const data = await getRiwayatApprovalPdfData();

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader(
            'Content-Disposition',
            'attachment; filename="riwayat-approval-atasan-level-2.pdf"'
        );

        const doc = new PDFDocument({
            margin: 35,
            size: 'A4',
            layout: 'landscape',
            bufferPages: true
        });

        doc.pipe(res);

        // 1. HEADER
        doc.fontSize(20).font('Helvetica-Bold').fillColor('#000000').text('FACULTYWARE', { align: 'center' });
        doc.fontSize(12).font('Helvetica').text('Sistem Pengajuan Cuti Pegawai', { align: 'center' });
        doc.moveDown(0.5);
        
        doc.moveTo(35, doc.y).lineTo(807, doc.y).lineWidth(1).strokeColor('#000000').stroke();
        doc.moveDown(1);
        
        doc.fontSize(14).font('Helvetica-Bold').text('LAPORAN RIWAYAT APPROVAL CUTI ATASAN LEVEL 2', { align: 'center' });
        doc.moveDown(1.5);

        // 2. INFORMASI DOKUMEN & 3. RINGKASAN STATUS
        const approvedCount = data.filter(item => item.status === 'approved').length;
        const rejectedCount = data.filter(item => item.status === 'rejected').length;
        const userName = (req.session && req.session.user && req.session.user.name) ? req.session.user.name : 'Atasan Level 2';

        const startYInfo = doc.y;
        
        doc.fontSize(10).font('Helvetica');
        doc.text(`Tanggal Cetak`, 35, startYInfo, { continued: true }).text(`: ${getPrintedDate()}`, 120, startYInfo);
        doc.text(`Dicetak Oleh`, 35, startYInfo + 15, { continued: true }).text(`: ${userName}`, 120, startYInfo + 15);
        doc.text(`Jenis Laporan`, 35, startYInfo + 30, { continued: true }).text(`: Riwayat Approval Cuti`, 120, startYInfo + 30);
        doc.text(`Status Data`, 35, startYInfo + 45, { continued: true }).text(`: Approved dan Rejected`, 120, startYInfo + 45);
        doc.text(`Total Data`, 35, startYInfo + 60, { continued: true }).text(`: ${data.length} Pengajuan`, 120, startYInfo + 60);

        // Ringkasan
        doc.font('Helvetica-Bold').text('Ringkasan:', 600, startYInfo);
        doc.font('Helvetica').text(`Approved`, 600, startYInfo + 15, { continued: true }).text(`: ${approvedCount}`, 660, startYInfo + 15);
        doc.text(`Rejected`, 600, startYInfo + 30, { continued: true }).text(`: ${rejectedCount}`, 660, startYInfo + 30);
        doc.font('Helvetica-Bold').text(`Total`, 600, startYInfo + 45, { continued: true }).text(`: ${data.length}`, 660, startYInfo + 45);

        doc.y = startYInfo + 90;

        if (data.length === 0) {
            doc.fontSize(11).font('Helvetica-Oblique').text('Belum ada riwayat pengajuan cuti yang berstatus approved atau rejected.', 35, doc.y, { align: 'center' });
        } else {
            // 4. TABEL DATA
            const tableTop = doc.y;
            
            const renderTableHeader = (yPos) => {
                doc.rect(35, yPos, 772, 20).fill('#f0f0f0');
                doc.fillColor('#000000').font('Helvetica-Bold').fontSize(9);
                doc.text('No', 40, yPos + 5, { width: 25, align: 'center' });
                doc.text('ID', 70, yPos + 5, { width: 40, align: 'left' });
                doc.text('Nama Pegawai', 115, yPos + 5, { width: 120, align: 'left' });
                doc.text('Jenis Cuti', 240, yPos + 5, { width: 80, align: 'left' });
                doc.text('Tanggal Cuti', 325, yPos + 5, { width: 110, align: 'left' });
                doc.text('Hari', 440, yPos + 5, { width: 30, align: 'center' });
                doc.text('Status', 475, yPos + 5, { width: 60, align: 'left' });
                doc.text('Diproses', 540, yPos + 5, { width: 70, align: 'left' });
                doc.text('Catatan', 615, yPos + 5, { width: 185, align: 'left' });
                doc.moveTo(35, yPos + 20).lineTo(807, yPos + 20).lineWidth(0.5).strokeColor('#cccccc').stroke();
                return yPos + 25;
            };

            let currentY = renderTableHeader(tableTop);

            data.forEach((item, index) => {
                // 6. PAGE BREAK
                if (currentY > 520) {
                    doc.addPage();
                    currentY = renderTableHeader(35);
                }

                const statusText = item.status === 'approved' ? 'Approved' : 'Rejected';
                const processedDate = item.approval_action_date || item.approved_at || item.created_at;
                
                const empName = item.employee_name || '-';
                const leaveTypeName = item.leave_type_name || '-';
                const tglCuti = `${formatDatePdf(item.start_date)} - ${formatDatePdf(item.end_date)}`;
                const hari = `${item.total_days || 0}`;
                const diproses = formatDatePdf(processedDate);
                const catatan = item.approval_notes ? item.approval_notes.replace(/\r?\n|\r/g, ' ').trim() : '-';

                doc.font('Helvetica').fontSize(9).fillColor('#000000');
                
                const rowY = currentY;
                
                const hName = doc.heightOfString(empName, { width: 120 });
                const hJenis = doc.heightOfString(leaveTypeName, { width: 80 });
                const hTgl = doc.heightOfString(tglCuti, { width: 110 });
                const hCatatan = doc.heightOfString(catatan, { width: 185 });
                const rowHeight = Math.max(hName, hJenis, hTgl, hCatatan, 15);

                doc.text(`${index + 1}`, 40, rowY, { width: 25, align: 'center' });
                doc.text(`${item.id}`, 70, rowY, { width: 40, align: 'left' });
                doc.text(empName, 115, rowY, { width: 120, align: 'left' });
                doc.text(leaveTypeName, 240, rowY, { width: 80, align: 'left' });
                doc.text(tglCuti, 325, rowY, { width: 110, align: 'left' });
                doc.text(hari, 440, rowY, { width: 30, align: 'center' });
                doc.text(statusText, 475, rowY, { width: 60, align: 'left' });
                doc.text(diproses, 540, rowY, { width: 70, align: 'left' });
                doc.text(catatan, 615, rowY, { width: 185, align: 'left', lineBreak: true });

                currentY = rowY + rowHeight + 5;
                doc.moveTo(35, currentY).lineTo(807, currentY).lineWidth(0.5).strokeColor('#eeeeee').stroke();
                currentY += 5;
            });
        }

        // 7. FOOTER
        const pages = doc.bufferedPageRange();
        for (let i = 0; i < pages.count; i++) {
            doc.switchToPage(i);
            const bottomPos = doc.page.height - 35;
            doc.moveTo(35, bottomPos - 10).lineTo(807, bottomPos - 10).lineWidth(0.5).strokeColor('#cccccc').stroke();
            doc.fontSize(8).font('Helvetica').fillColor('#888888');
            doc.text(`Facultyware - Laporan Riwayat Approval Cuti | Halaman ${i + 1} dari ${pages.count}`, 35, bottomPos, { align: 'right' });
        }

        doc.end();
    } catch (error) {
        console.error('Error at exportRiwayatPdf:', error);

        if (!res.headersSent) {
            return res.status(500).send('Terjadi kesalahan saat membuat file PDF.');
        }
    }
};