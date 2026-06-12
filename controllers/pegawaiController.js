const cutiModel = require('../models/cutiModel');

// Helper untuk menghitung jumlah hari kerja/cuti di antara 2 tanggal (inklusif)
function calculateTotalDays(startDateStr, endDateStr) {
    const start = new Date(startDateStr);
    const end = new Date(endDateStr);
    const diffTime = Math.abs(end - start);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    return diffDays;
}

// 1. Dashboard Pegawai
exports.index = async (req, res) => {
    const employeeId = req.session.user.id;
    const year = 2026; // Sesuai data default di database

    try {
        // Ambil sisa kuota cuti
        const balances = await cutiModel.getLeaveBalances(employeeId, year);
        
        // Ambil 5 pengajuan cuti terakhir
        const recentRequests = await cutiModel.getLeaveRequests(employeeId, '', '', 'DESC', 5, 0);

        // Ambil jumlah notifikasi belum dibaca
        const unreadCount = await cutiModel.getUnreadNotificationsCount(employeeId);

        res.render('pegawai/dashboard', {
            user: req.session.user,
            balances,
            recentRequests,
            unreadCount,
            title: 'Dashboard Pegawai - Facultyware'
        });
    } catch (error) {
        console.error('Error dashboard:', error);
        res.status(500).send('Terjadi kesalahan saat memuat dashboard');
    }
};

// 2. Riwayat Pengajuan Cuti (Tabel, Search, Pagination, Sorting)
exports.renderCutiRiwayat = async (req, res) => {
    const employeeId = req.session.user.id;
    
    // Parameter Query
    const search = req.query.search || '';
    const status = req.query.status || '';
    const sort = req.query.sort || 'DESC';
    const page = parseInt(req.query.page) || 1;
    const limit = 5; // Batasi 5 baris per halaman untuk mempermudah pengujian pagination
    const offset = (page - 1) * limit;

    try {
        // Total data untuk menghitung pagination
        const totalRows = await cutiModel.getLeaveRequestsCount(employeeId, search, status);
        const totalPages = Math.ceil(totalRows / limit);

        // Ambil data sesuai filter & pagination
        const requests = await cutiModel.getLeaveRequests(employeeId, search, status, sort, limit, offset);

        // Ambil jumlah notifikasi belum dibaca
        const unreadCount = await cutiModel.getUnreadNotificationsCount(employeeId);

        res.render('pegawai/cuti_riwayat', {
            requests,
            search,
            status,
            sort,
            currentPage: page,
            totalPages,
            unreadCount,
            success: req.query.success || null,
            error: req.query.error || null,
            title: 'Riwayat Pengajuan Cuti - Facultyware'
        });
    } catch (error) {
        console.error('Error riwayat cuti:', error);
        res.status(500).send('Terjadi kesalahan saat memuat riwayat cuti');
    }
};

// 3. Form Pembuatan Pengajuan Cuti
exports.renderCutiTambah = async (req, res) => {
    const employeeId = req.session.user.id;
    const year = 2026;

    try {
        // Ambil daftar jenis cuti dan kuota tersisa
        const balances = await cutiModel.getLeaveBalances(employeeId, year);
        const unreadCount = await cutiModel.getUnreadNotificationsCount(employeeId);

        res.render('pegawai/cuti_tambah', {
            balances,
            unreadCount,
            error: null,
            title: 'Buat Pengajuan Cuti - Facultyware'
        });
    } catch (error) {
        console.error('Error render form tambah:', error);
        res.status(500).send('Terjadi kesalahan saat membuka form');
    }
};

// 4. Proses Simpan Pengajuan Cuti
exports.processCutiTambah = async (req, res) => {
    const employeeId = req.session.user.id;
    const year = 2026;
    const { leave_type_id, start_date, end_date, reason } = req.body;

    try {
        const balances = await cutiModel.getLeaveBalances(employeeId, year);
        const unreadCount = await cutiModel.getUnreadNotificationsCount(employeeId);

        // Validasi Form
        if (!leave_type_id || !start_date || !end_date || !reason) {
            return res.render('pegawai/cuti_tambah', {
                balances,
                unreadCount,
                error: 'Semua field wajib diisi!',
                title: 'Buat Pengajuan Cuti - Facultyware'
            });
        }

        // Validasi Tanggal
        if (new Date(end_date) < new Date(start_date)) {
            return res.render('pegawai/cuti_tambah', {
                balances,
                unreadCount,
                error: 'Tanggal selesai tidak boleh mendahului tanggal mulai!',
                title: 'Buat Pengajuan Cuti - Facultyware'
            });
        }

        const totalDays = calculateTotalDays(start_date, end_date);

        // Validasi Saldo Kuota
        const userBalance = await cutiModel.getLeaveBalance(employeeId, leave_type_id, year);
        if (!userBalance) {
            return res.render('pegawai/cuti_tambah', {
                balances,
                unreadCount,
                error: 'Jenis cuti tidak valid atau tidak terdaftar!',
                title: 'Buat Pengajuan Cuti - Facultyware'
            });
        }

        if (totalDays > userBalance.remaining) {
            return res.render('pegawai/cuti_tambah', {
                balances,
                unreadCount,
                error: `Sisa kuota cuti Anda (${userBalance.remaining} hari) tidak mencukupi untuk pengajuan ${totalDays} hari!`,
                title: 'Buat Pengajuan Cuti - Facultyware'
            });
        }

        // Simpan ke database dengan default status = pending
        // approver_id_id default ke ID 6 (Atasan 1) yang diseed
        await cutiModel.createLeaveRequest({
            employee_id: employeeId,
            leave_type_id: parseInt(leave_type_id),
            start_date,
            end_date,
            total_days: totalDays,
            reason,
            approver_id_id: 6 
        });

        res.redirect('/pegawai/cuti?success=' + encodeURIComponent('Pengajuan cuti berhasil dibuat!'));

    } catch (error) {
        console.error('Error proses tambah:', error);
        res.status(500).send('Terjadi kesalahan saat memproses pengajuan cuti');
    }
};

// 5. Melihat Detail Pengajuan Cuti
exports.renderCutiDetail = async (req, res) => {
    const employeeId = req.session.user.id;
    const id = req.params.id;

    try {
        const cuti = await cutiModel.getLeaveRequestById(id, employeeId);
        if (!cuti) {
            return res.redirect('/pegawai/cuti?error=' + encodeURIComponent('Pengajuan cuti tidak ditemukan!'));
        }

        const unreadCount = await cutiModel.getUnreadNotificationsCount(employeeId);

        res.render('pegawai/cuti_detail', {
            cuti,
            unreadCount,
            success: req.query.success || null,
            error: req.query.error || null,
            title: `Detail Pengajuan #${cuti.id} - Facultyware`
        });
    } catch (error) {
        console.error('Error render detail:', error);
        res.status(500).send('Terjadi kesalahan saat memuat detail pengajuan');
    }
};

// 6. Form Ubah Pengajuan Cuti (Hanya jika status "pending")
exports.renderCutiEdit = async (req, res) => {
    const employeeId = req.session.user.id;
    const id = req.params.id;
    const year = 2026;

    try {
        const cuti = await cutiModel.getLeaveRequestById(id, employeeId);
        if (!cuti) {
            return res.redirect('/pegawai/cuti?error=' + encodeURIComponent('Pengajuan cuti tidak ditemukan!'));
        }

        // Syarat: Hanya status pending yang boleh diedit
        if (cuti.status !== 'pending') {
            return res.redirect(`/pegawai/cuti/${id}?error=` + encodeURIComponent('Hanya pengajuan berstatus "Menunggu Persetujuan" yang dapat diubah!'));
        }

        const balances = await cutiModel.getLeaveBalances(employeeId, year);
        const unreadCount = await cutiModel.getUnreadNotificationsCount(employeeId);

        res.render('pegawai/cuti_edit', {
            cuti,
            balances,
            unreadCount,
            error: null,
            title: `Ubah Pengajuan #${cuti.id} - Facultyware`
        });
    } catch (error) {
        console.error('Error render form edit:', error);
        res.status(500).send('Terjadi kesalahan saat membuka form edit');
    }
};

// 7. Proses Simpan Perubahan Pengajuan Cuti
exports.processCutiEdit = async (req, res) => {
    const employeeId = req.session.user.id;
    const id = req.params.id;
    const year = 2026;
    const { leave_type_id, start_date, end_date, reason } = req.body;

    try {
        const cuti = await cutiModel.getLeaveRequestById(id, employeeId);
        if (!cuti) {
            return res.redirect('/pegawai/cuti?error=' + encodeURIComponent('Pengajuan cuti tidak ditemukan!'));
        }

        if (cuti.status !== 'pending') {
            return res.redirect(`/pegawai/cuti/${id}?error=` + encodeURIComponent('Hanya pengajuan berstatus "Menunggu Persetujuan" yang dapat diubah!'));
        }

        const balances = await cutiModel.getLeaveBalances(employeeId, year);
        const unreadCount = await cutiModel.getUnreadNotificationsCount(employeeId);

        // Validasi Form
        if (!leave_type_id || !start_date || !end_date || !reason) {
            return res.render('pegawai/cuti_edit', {
                cuti,
                balances,
                unreadCount,
                error: 'Semua field wajib diisi!',
                title: `Ubah Pengajuan #${cuti.id} - Facultyware`
            });
        }

        // Validasi Tanggal
        if (new Date(end_date) < new Date(start_date)) {
            return res.render('pegawai/cuti_edit', {
                cuti,
                balances,
                unreadCount,
                error: 'Tanggal selesai tidak boleh mendahului tanggal mulai!',
                title: `Ubah Pengajuan #${cuti.id} - Facultyware`
            });
        }

        const totalDays = calculateTotalDays(start_date, end_date);

        // Validasi Saldo Kuota
        const userBalance = await cutiModel.getLeaveBalance(employeeId, leave_type_id, year);
        if (!userBalance) {
            return res.render('pegawai/cuti_edit', {
                cuti,
                balances,
                unreadCount,
                error: 'Jenis cuti tidak valid!',
                title: `Ubah Pengajuan #${cuti.id} - Facultyware`
            });
        }

        if (totalDays > userBalance.remaining) {
            return res.render('pegawai/cuti_edit', {
                cuti,
                balances,
                unreadCount,
                error: `Sisa kuota cuti Anda (${userBalance.remaining} hari) tidak mencukupi untuk pengajuan ${totalDays} hari!`,
                title: `Ubah Pengajuan #${cuti.id} - Facultyware`
            });
        }

        // Lakukan Update ke DB
        const success = await cutiModel.updateLeaveRequest(id, employeeId, {
            leave_type_id: parseInt(leave_type_id),
            start_date,
            end_date,
            total_days: totalDays,
            reason
        });

        if (success) {
            res.redirect(`/pegawai/cuti/${id}?success=` + encodeURIComponent('Pengajuan cuti berhasil diperbarui!'));
        } else {
            res.redirect(`/pegawai/cuti/${id}?error=` + encodeURIComponent('Gagal memperbarui pengajuan cuti!'));
        }

    } catch (error) {
        console.error('Error proses edit:', error);
        res.status(500).send('Terjadi kesalahan saat memperbarui pengajuan cuti');
    }
};

// 8. Proses Hapus Pengajuan Cuti (Hanya jika status "pending")
exports.processCutiDelete = async (req, res) => {
    const employeeId = req.session.user.id;
    const id = req.params.id;

    try {
        const cuti = await cutiModel.getLeaveRequestById(id, employeeId);
        if (!cuti) {
            return res.redirect('/pegawai/cuti?error=' + encodeURIComponent('Pengajuan cuti tidak ditemukan!'));
        }

        // Syarat: Hanya status pending yang boleh dihapus
        if (cuti.status !== 'pending') {
            return res.redirect(`/pegawai/cuti/${id}?error=` + encodeURIComponent('Hanya pengajuan berstatus "Menunggu Persetujuan" yang dapat dihapus!'));
        }

        const success = await cutiModel.deleteLeaveRequest(id, employeeId);
        if (success) {
            res.redirect('/pegawai/cuti?success=' + encodeURIComponent('Pengajuan cuti berhasil dihapus!'));
        } else {
            res.redirect(`/pegawai/cuti/${id}?error=` + encodeURIComponent('Gagal menghapus pengajuan cuti!'));
        }

    } catch (error) {
        console.error('Error proses hapus:', error);
        res.status(500).send('Terjadi kesalahan saat menghapus pengajuan cuti');
    }
};

// 9. Halaman Notifikasi Pegawai
exports.renderNotifikasi = async (req, res) => {
    const userId = req.session.user.id;

    try {
        const notifications = await cutiModel.getNotifications(userId);
        const unreadCount = await cutiModel.getUnreadNotificationsCount(userId);

        res.render('pegawai/notifikasi', {
            notifications,
            unreadCount,
            title: 'Notifikasi Anda - Facultyware'
        });
    } catch (error) {
        console.error('Error render notifikasi:', error);
        res.status(500).send('Terjadi kesalahan saat memuat notifikasi');
    }
};

// 10. API Tandai Notifikasi Dibaca
exports.processMarkAsRead = async (req, res) => {
    const userId = req.session.user.id;
    const id = req.params.id;

    try {
        const success = await cutiModel.markNotificationAsRead(id, userId);
        if (success) {
            res.json({ success: true, message: 'Notifikasi berhasil ditandai sebagai dibaca' });
        } else {
            res.status(400).json({ success: false, message: 'Gagal memperbarui notifikasi' });
        }
    } catch (error) {
        console.error('Error mark as read:', error);
        res.status(500).json({ success: false, error: error.message });
    }
};

// =========================================================
// FITUR 8: Export Riwayat Cuti ke PDF
// =========================================================

const { generateLeavePDF } = require('../lib/exportPdf');

// Export ke PDF
exports.exportCutiPDF = async (req, res) => {
    const employeeId = req.session.user.id;
    const search = req.query.search || '';
    const status = req.query.status || '';

    try {
        const requests = await cutiModel.getAllLeaveRequestsForExport(employeeId, search, status);
        generateLeavePDF(res, requests, req.session.user);
    } catch (error) {
        console.error('Error export PDF:', error);
        res.status(500).send('Terjadi kesalahan saat mengekspor PDF');
    }
};

