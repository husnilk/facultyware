const cutiModel = require('../models/cutiModel');
const exportPdf = require('../lib/exportPdf');
const exportDocx = require('../lib/exportDocx');

exports.index = async (req, res) => {
    try {
        // Tangkap parameter 'status' dari URL. Default: 'all'
        const currentStatus = req.query.status || 'all';

        // Ambil data rekapitulasi cuti dengan filter
        const leaveRequests = await cutiModel.getAllLeaveRequests(currentStatus);

        // Merender halaman dan mengirimkan datanya
        res.render('admin/index', { 
            title: 'Rekapitulasi Cuti Pegawai',
            user: req.session.user, 
            leaveRequests: leaveRequests,
            currentStatus: currentStatus // Kirim status aktif ke view
        });
    } catch (error) {
        console.error('Error fetching leave requests:', error);
        res.status(500).send('Terjadi kesalahan saat memuat data cuti.');
    }
};

exports.exportPdf = async (req, res) => {
    try {
        const currentStatus = req.query.status || 'all';
        const leaveRequests = await cutiModel.getAllLeaveRequests(currentStatus);
        
        const doc = exportPdf.generate(leaveRequests);
        
        // Atur header HTTP agar browser mengenali ini sebagai file unduhan PDF
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=Laporan_Cuti_${currentStatus}.pdf`);
        
        doc.pipe(res);
        doc.end();
    } catch (error) {
        console.error('Error export PDF:', error);
        res.status(500).send('Gagal mengekspor PDF');
    }
};

exports.exportDocx = async (req, res) => {
    try {
        const currentStatus = req.query.status || 'all';
        const leaveRequests = await cutiModel.getAllLeaveRequests(currentStatus);
        
        const buffer = await exportDocx.generate(leaveRequests);
        
        // Atur header HTTP agar browser mengenali ini sebagai file unduhan DOCX (Word)
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
        res.setHeader('Content-Disposition', `attachment; filename=Laporan_Cuti_${currentStatus}.docx`);
        
        res.send(buffer);
    } catch (error) {
        console.error('Error export DOCX:', error);
        res.status(500).send('Gagal mengekspor DOCX');
    }
};

// --- FUNGSI BARU UNTUK HALAMAN STATISTIK ---
exports.statistik = async (req, res) => {
    try {
        const stats = await cutiModel.getLeaveStatistics();
        
        res.render('admin/statistik', {
            title: 'Statistik Cuti Pegawai',
            user: req.session.user,
            stats: stats
        });
    } catch (error) {
        console.error('Error fetching statistics:', error);
        res.status(500).send('Terjadi kesalahan saat memuat statistik cuti.');
    }
};

// --- FUNGSI BARU UNTUK REST API ADMIN ---
exports.getStatistikAPI = async (req, res) => {
    try {
        // Mengambil statistik dan semua data cuti
        const stats = await cutiModel.getLeaveStatistics();
        const allRequests = await cutiModel.getAllLeaveRequests('all');

        // Mengembalikan format JSON
        res.status(200).json({
            success: true,
            message: 'Berhasil mengambil data statistik dan seluruh riwayat cuti',
            data: {
                statistik: stats,
                total_pengajuan: allRequests.length,
                riwayat: allRequests
            }
        });
    } catch (error) {
        console.error('Error Admin API:', error);
        res.status(500).json({
            success: false,
            message: 'Terjadi kesalahan pada server saat mengambil data'
        });
    }
};