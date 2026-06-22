const cutiModel = require('../models/cutiModel');
const PDFDocument = require('pdfkit');

const hitungHari = (start, end) => {
    return Math.ceil(Math.abs(new Date(end) - new Date(start)) / (1000 * 60 * 60 * 24)) + 1;
};

exports.index = async (req, res) => {
    try {
        const employeeId = req.session.user.id; 
        const stats = await cutiModel.getEmployeeLeaveStatistics(employeeId);
        const pendingRequests = await cutiModel.getEmployeeLeaveRequests(employeeId, 'pending');
        
        res.render('pegawai/index', {
            title: 'Dashboard Cuti',
            user: req.session.user,
            stats: stats,
            requests: pendingRequests
        });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).send('Terjadi kesalahan saat memuat dashboard.');
    }
};

exports.riwayat = async (req, res) => {
    try {
        const employeeId = req.session.user.id; 
        const historyRequests = await cutiModel.getEmployeeLeaveRequests(employeeId, 'history');
        
        res.render('pegawai/riwayat', {
            title: 'Riwayat Cuti',
            user: req.session.user,
            requests: historyRequests
        });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).send('Terjadi kesalahan saat memuat riwayat cuti.');
    }
};

// --- FUNGSI BARU: HALAMAN NOTIFIKASI ---
exports.notifications = async (req, res) => {
    try {
        const employeeId = req.session.user.id;
        const notifications = await cutiModel.getEmployeeNotifications(employeeId);
        
        res.render('pegawai/notifications', {
            title: 'Notifikasi',
            user: req.session.user,
            notifications: notifications
        });
    } catch (error) {
        console.error('Error notifications:', error);
        res.status(500).send('Terjadi kesalahan saat memuat notifikasi.');
    }
};

exports.create = async (req, res) => {
    try {
        const leaveTypes = await cutiModel.getLeaveTypes();
        res.render('pegawai/create', {
            title: 'Buat Pengajuan Cuti',
            user: req.session.user,
            leaveTypes: leaveTypes,
            error: null
        });
    } catch (error) {
        console.error('Error form:', error);
        res.status(500).send('Terjadi kesalahan saat memuat form.');
    }
};

exports.store = async (req, res) => {
    try {
        const { leave_type_id, start_date, end_date, reason, address_leave, contact_leave } = req.body;
        const employeeId = req.session.user.id;
        
        if (new Date(end_date) < new Date(start_date)) {
            const leaveTypes = await cutiModel.getLeaveTypes();
            return res.render('pegawai/create', {
                title: 'Buat Pengajuan Cuti', user: req.session.user, leaveTypes,
                error: 'Tanggal selesai tidak boleh lebih awal dari tanggal mulai!'
            });
        }

        const totalDays = hitungHari(start_date, end_date);

        await cutiModel.createLeaveRequest({
            employee_id: employeeId,
            leave_type_id: parseInt(leave_type_id),
            start_date, end_date, total_days: totalDays,
            reason, address_leave, contact_leave,
            approver_id_id: 6
        });

        res.redirect('/pegawai');
    } catch (error) {
        console.error('Error simpan:', error);
        res.status(500).send('Gagal menyimpan pengajuan cuti.');
    }
};

exports.detail = async (req, res) => {
    try {
        const employeeId = req.session.user.id;
        const cuti = await cutiModel.getEmployeeLeaveRequestById(req.params.id, employeeId);
        
        if (!cuti) {
            return res.status(404).send('Data pengajuan tidak ditemukan atau Anda tidak memiliki akses.');
        }

        let approvals = [];
        try {
            approvals = await cutiModel.getLeaveApprovals(req.params.id);
        } catch (err) {
            console.warn("Gagal mengambil data approval:", err.message);
        }
        
        res.render('pegawai/detail', {
            title: 'Detail Pengajuan Cuti',
            user: req.session.user,
            cuti: cuti,
            approvals: approvals 
        });
    } catch (error) {
        console.error('Error detail:', error);
        res.status(500).send('Terjadi kesalahan saat memuat detail pengajuan.');
    }
};

exports.delete = async (req, res) => {
    try {
        const employeeId = req.session.user.id;
        const requestId = req.params.id;
        
        const success = await cutiModel.deleteLeaveRequest(requestId, employeeId);
        
        if (success) {
            res.redirect('/pegawai');
        } else {
            res.status(400).send('Gagal menghapus. Pengajuan mungkin sudah diproses oleh Atasan atau data tidak ditemukan.');
        }
    } catch (error) {
        console.error('Error delete:', error);
        res.status(500).send('Terjadi kesalahan saat mencoba menghapus pengajuan.');
    }
};

exports.edit = async (req, res) => {
    try {
        const employeeId = req.session.user.id;
        const cuti = await cutiModel.getEmployeeLeaveRequestById(req.params.id, employeeId);

        if (!cuti || cuti.status !== 'pending') {
            return res.status(403).send('Data tidak ditemukan atau sudah tidak dapat diubah (karena sudah diproses).');
        }

        const leaveTypes = await cutiModel.getLeaveTypes();
        res.render('pegawai/edit', {
            title: 'Ubah Pengajuan Cuti',
            user: req.session.user,
            cuti: cuti,
            leaveTypes: leaveTypes,
            error: null
        });
    } catch (error) {
        console.error('Error edit:', error);
        res.status(500).send('Terjadi kesalahan saat memuat halaman edit.');
    }
};

exports.update = async (req, res) => {
    try {
        const { leave_type_id, start_date, end_date, reason, address_leave, contact_leave } = req.body;
        const employeeId = req.session.user.id;
        const requestId = req.params.id;

        if (new Date(end_date) < new Date(start_date)) {
            const cuti = await cutiModel.getEmployeeLeaveRequestById(requestId, employeeId);
            const leaveTypes = await cutiModel.getLeaveTypes();
            return res.render('pegawai/edit', {
                title: 'Ubah Pengajuan Cuti', user: req.session.user, cuti, leaveTypes,
                error: 'Tanggal selesai tidak boleh lebih awal dari tanggal mulai!'
            });
        }

        const totalDays = hitungHari(start_date, end_date);

        const success = await cutiModel.updateLeaveRequest(requestId, employeeId, {
            leave_type_id: parseInt(leave_type_id),
            start_date, end_date, total_days: totalDays,
            reason, address_leave, contact_leave
        });

        if (success) {
            res.redirect('/pegawai/' + requestId);
        } else {
            res.status(400).send('Gagal mengubah pengajuan.');
        }
    } catch (error) {
        console.error('Error update:', error);
        res.status(500).send('Gagal mengubah pengajuan cuti.');
    }
};

exports.getRiwayatAPI = async (req, res) => {
    try {
        const employeeId = req.session.user.id; 
        const requests = await cutiModel.getEmployeeLeaveRequests(employeeId);
        
        res.status(200).json({
            success: true,
            message: 'Berhasil mengambil data riwayat cuti',
            total_data: requests.length,
            data: requests
        });
    } catch (error) {
        console.error('Error API:', error);
        res.status(500).json({
            success: false,
            message: 'Terjadi kesalahan pada server saat mengambil data'
        });
    }
};

exports.exportPdf = async (req, res) => {
    try {
        const employeeId = req.session.user.id; 
        const requests = await cutiModel.getEmployeeLeaveRequests(employeeId, 'all');

        const doc = new PDFDocument({ margin: 50, size: 'A4' });
        
        const filename = `Riwayat_Cuti_${req.session.user.name.replace(/\s+/g, '_')}.pdf`;
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=${filename}`);
        
        doc.pipe(res);

        const primaryColor = '#000000';
        const textColor = '#374151';
        const lightGray = '#e5e7eb';

        doc.fillColor(primaryColor).fontSize(22).font('Helvetica-Bold').text('Laporan Riwayat Cuti Pegawai', { align: 'center' });
        doc.moveDown(0.5);

        doc.fillColor(textColor).fontSize(11).font('Helvetica');
        doc.text(`Nama Pegawai : ${req.session.user.name}`);
        doc.text(`Tanggal Cetak: ${new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}`);
        doc.moveDown(0.5);

        doc.moveTo(50, doc.y).lineTo(545, doc.y).lineWidth(1.5).strokeColor(lightGray).stroke();
        doc.moveDown(1.5);

        if (requests.length === 0) {
            doc.fillColor('#6b7280').font('Helvetica-Oblique').text('Belum ada riwayat pengajuan cuti yang tercatat.', { align: 'center' });
        } else {
            requests.forEach((cuti, index) => {
                doc.fillColor(primaryColor).fontSize(12).font('Helvetica-Bold').text(`${index + 1}. Pengajuan #${cuti.id} - ${cuti.leave_type_name}`);
                doc.moveDown(0.3);

                doc.fillColor(textColor).font('Helvetica').fontSize(10);
                
                let statusColor = '#ca8a04'; 
                if (cuti.status === 'approved') statusColor = '#16a34a'; 
                if (cuti.status === 'rejected') statusColor = '#dc2626';

                doc.text('Status      : ', { continued: true }).fillColor(statusColor).font('Helvetica-Bold').text(cuti.status.toUpperCase());
                doc.fillColor(textColor).font('Helvetica');
                doc.text(`Tanggal     : ${new Date(cuti.start_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })} s/d ${new Date(cuti.end_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })} (${cuti.total_days} hari)`);
                doc.text(`Alasan      : ${cuti.reason}`);
                doc.moveDown(1);

                doc.moveTo(50, doc.y).lineTo(545, doc.y).lineWidth(0.5).strokeColor(lightGray).stroke();
                doc.moveDown(1);
            });
        }

        const pageCount = doc.bufferedPageRange ? doc.bufferedPageRange().count : 1;
        doc.fontSize(9).fillColor('#9ca3af').text(`Generate by Facultyware System`, 50, 780, { align: 'center', lineBreak: false });

        doc.end();
    } catch (error) {
        console.error('Error export PDF:', error);
        res.status(500).send('Gagal membuat dokumen PDF.');
    }
};