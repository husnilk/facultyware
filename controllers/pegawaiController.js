const cutiModel = require('../models/cutiModel');
const PDFDocument = require('pdfkit'); // Import library pembuat PDF

// Helper untuk hitung jumlah hari cuti otomatis
const hitungHari = (start, end) => {
    return Math.ceil(Math.abs(new Date(end) - new Date(start)) / (1000 * 60 * 60 * 24)) + 1;
};

exports.index = async (req, res) => {
    try {
        const employeeId = req.session.user.id; 
        const requests = await cutiModel.getEmployeeLeaveRequests(employeeId);
        res.render('pegawai/index', {
            title: 'Riwayat Cuti Pegawai',
            user: req.session.user,
            requests: requests
        });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).send('Terjadi kesalahan saat memuat halaman riwayat cuti.');
    }
};

// Menampilkan form tambah pengajuan
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

// Memproses data dari form
exports.store = async (req, res) => {
    try {
        const { leave_type_id, start_date, end_date, reason, address_leave, contact_leave } = req.body;
        const employeeId = req.session.user.id;
        
        // Validasi logika tanggal dasar
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
            approver_id_id: 6 // ID atasan langsung (di-hardcode untuk testing)
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
        
        res.render('pegawai/detail', {
            title: 'Detail Pengajuan Cuti',
            user: req.session.user,
            cuti: cuti
        });
    } catch (error) {
        console.error('Error detail:', error);
        res.status(500).send('Terjadi kesalahan saat memuat detail pengajuan.');
    }
};

// Proses Hapus Pengajuan
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

// Menampilkan form edit
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

// Memproses data dari form edit
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

// --- FUNGSI REST API ---
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

// --- FUNGSI EXPORT PDF  ---
exports.exportPdf = async (req, res) => {
    try {
        const employeeId = req.session.user.id; 
        const requests = await cutiModel.getEmployeeLeaveRequests(employeeId);

        // Inisialisasi dokumen PDF baru dengan ukuran A4
        const doc = new PDFDocument({ margin: 50, size: 'A4' });
        
        // Atur header agar otomatis didownload oleh browser
        const filename = `Riwayat_Cuti_${req.session.user.name.replace(/\s+/g, '_')}.pdf`;
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=${filename}`);
        
        doc.pipe(res);

        // --- KONFIGURASI WARNA ---
        const primaryColor = '#000000'; // Biru khas Facultyware
        const textColor = '#374151'; // Abu-abu gelap untuk teks
        const lightGray = '#e5e7eb'; // Abu-abu terang untuk garis

        // --- HEADER DOKUMEN ---
        doc.fillColor(primaryColor)
           .fontSize(22)
           .font('Helvetica-Bold')
           .text('Laporan Riwayat Cuti Pegawai', { align: 'center' });
        
        doc.moveDown(0.5);

        // --- INFORMASI PEGAWAI ---
        doc.fillColor(textColor)
           .fontSize(11)
           .font('Helvetica');
        
        doc.text(`Nama Pegawai : ${req.session.user.name}`);
        doc.text(`Tanggal Cetak: ${new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}`);
        
        doc.moveDown(0.5);

        // --- GARIS PEMBATAS ATAS ---
        doc.moveTo(50, doc.y)
           .lineTo(545, doc.y)
           .lineWidth(1.5)
           .strokeColor(lightGray)
           .stroke();
        
        doc.moveDown(1.5);

        // --- KONTEN RIWAYAT CUTI ---
        if (requests.length === 0) {
            doc.fillColor('#6b7280')
               .font('Helvetica-Oblique')
               .text('Belum ada riwayat pengajuan cuti yang tercatat.', { align: 'center' });
        } else {
            requests.forEach((cuti, index) => {
                // Judul per pengajuan
                doc.fillColor(primaryColor)
                   .fontSize(12)
                   .font('Helvetica-Bold')
                   .text(`${index + 1}. Pengajuan #${cuti.id} - ${cuti.leave_type_name}`);
                
                doc.moveDown(0.3);

                // Konten per pengajuan
                doc.fillColor(textColor).font('Helvetica').fontSize(10);
                
                // Menentukan warna status
                let statusColor = '#ca8a04'; // Default Kuning (Pending)
                if (cuti.status === 'approved') statusColor = '#16a34a'; // Hijau
                if (cuti.status === 'rejected') statusColor = '#dc2626'; // Merah

                // Baris Status
                doc.text('Status      : ', { continued: true })
                   .fillColor(statusColor)
                   .font('Helvetica-Bold')
                   .text(cuti.status.toUpperCase());

                // Kembalikan ke warna teks standar
                doc.fillColor(textColor).font('Helvetica');
                
                // Baris Tanggal & Alasan
                doc.text(`Tanggal     : ${new Date(cuti.start_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })} s/d ${new Date(cuti.end_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })} (${cuti.total_days} hari)`);
                doc.text(`Alasan      : ${cuti.reason}`);
                
                doc.moveDown(1);

                // --- GARIS PEMBATAS ANTAR ITEM ---
                doc.moveTo(50, doc.y)
                   .lineTo(545, doc.y)
                   .lineWidth(0.5)
                   .strokeColor(lightGray)
                   .stroke();
                
                doc.moveDown(1);
            });
        }

        // --- FOOTER (Halaman) ---
        // Menambahkan nomor halaman di bagian paling bawah
        const pageCount = doc.bufferedPageRange ? doc.bufferedPageRange().count : 1;
        doc.fontSize(9)
           .fillColor('#9ca3af')
           .text(`Generate by Facultyware System - Halaman 1`, 50, 780, { align: 'center', lineBreak: false });

        // Akhiri proses dokumen
        doc.end();
    } catch (error) {
        console.error('Error export PDF:', error);
        res.status(500).send('Gagal membuat dokumen PDF.');
    }
};