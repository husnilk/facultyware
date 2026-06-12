const XLSX = require('xlsx');

/**
 * Generate Excel (.xlsx) dari data riwayat pengajuan cuti pegawai
 * @param {object} res - Express response object
 * @param {Array} requests - Array data pengajuan cuti
 * @param {object} user - Data user (nama, dll)
 */
function generateLeaveExcel(res, requests, user) {
    // Siapkan data rows
    const rows = requests.map((r, idx) => {
        const statusLabel = r.status === 'approved' ? 'Disetujui' : r.status === 'rejected' ? 'Ditolak' : 'Menunggu Persetujuan';
        const tglMulai = new Date(r.start_date).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' });
        const tglSelesai = new Date(r.end_date).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' });
        const tglDiajukan = new Date(r.submitted_at).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' });

        return {
            'No': idx + 1,
            'No. Pengajuan': `#${r.id}`,
            'Jenis Cuti': r.leave_type_name || '-',
            'Tanggal Diajukan': tglDiajukan,
            'Tanggal Mulai': tglMulai,
            'Tanggal Selesai': tglSelesai,
            'Durasi (Hari)': r.total_days,
            'Alasan': r.reason || '-',
            'Status': statusLabel,
            'Komentar Atasan': r.approver_notes || '-',
        };
    });

    // Buat workbook & worksheet
    const wb = XLSX.utils.book_new();

    // Sheet info pegawai
    const infoData = [
        ['RIWAYAT PENGAJUAN CUTI'],
        ['Sistem Cuti Pegawai - Facultyware'],
        [],
        ['Nama Pegawai', user.name || '-'],
        ['Dicetak Pada', new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })],
        ['Total Data', `${requests.length} Pengajuan`],
        [],
    ];

    // Gabung header + rows ke satu sheet
    const ws = XLSX.utils.aoa_to_sheet(infoData);

    // Append data tabel di bawah info
    XLSX.utils.sheet_add_json(ws, rows, { origin: { r: infoData.length, c: 0 }, skipHeader: false });

    XLSX.utils.book_append_sheet(wb, ws, 'Riwayat Cuti');

    // Generate buffer & kirim sebagai response
    const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

    const filename = `riwayat-cuti-${(user.name || 'pegawai').replace(/\s+/g, '-')}-${Date.now()}.xlsx`;
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.send(buf);
}

module.exports = { generateLeaveExcel };
