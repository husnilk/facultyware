const PDFDocument = require('pdfkit');

/**
 * Generate PDF dari data riwayat pengajuan cuti pegawai
 * @param {object} res - Express response object
 * @param {Array} requests - Array data pengajuan cuti
 * @param {object} user - Data user (nama, dll)
 */
function generateLeavePDF(res, requests, user) {
    const doc = new PDFDocument({ margin: 50, size: 'A4' });

    // Set response header untuk download
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="riwayat-cuti-${user.name || 'pegawai'}-${Date.now()}.pdf"`);
    doc.pipe(res);

    // --- Header ---
    doc.fontSize(18).font('Helvetica-Bold').text('RIWAYAT PENGAJUAN CUTI', { align: 'center' });
    doc.fontSize(11).font('Helvetica').text('Sistem Cuti Pegawai - Facultyware', { align: 'center' });
    doc.moveDown(0.5);
    doc.moveTo(50, doc.y).lineTo(545, doc.y).strokeColor('#CBD5E1').stroke();
    doc.moveDown(0.5);

    // --- Info Pegawai ---
    doc.fontSize(10).font('Helvetica');
    doc.text(`Nama Pegawai : ${user.name || '-'}`);
    doc.text(`Dicetak pada : ${new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}`);
    doc.text(`Total Data   : ${requests.length} Pengajuan`);
    doc.moveDown(1);

    // --- Tabel Header ---
    const colWidths = [30, 100, 90, 90, 50, 85];
    const headers = ['No', 'Jenis Cuti', 'Tgl Mulai', 'Tgl Selesai', 'Durasi', 'Status'];
    const startX = 50;
    let y = doc.y;
    const rowHeight = 22;

    // Header row background
    doc.rect(startX, y, 495, rowHeight).fill('#1E3A5F');
    doc.fillColor('#FFFFFF').fontSize(9).font('Helvetica-Bold');

    let x = startX;
    headers.forEach((h, i) => {
        doc.text(h, x + 4, y + 7, { width: colWidths[i] - 8, align: i === 0 ? 'center' : 'left' });
        x += colWidths[i];
    });

    y += rowHeight;

    // --- Data Rows ---
    doc.fillColor('#1E293B').font('Helvetica').fontSize(8.5);

    if (requests.length === 0) {
        doc.rect(startX, y, 495, rowHeight).fill('#F8FAFC').stroke('#E2E8F0');
        doc.fillColor('#64748B').text('Tidak ada data pengajuan cuti.', startX + 4, y + 7, { width: 487, align: 'center' });
    } else {
        requests.forEach((r, idx) => {
            const rowColor = idx % 2 === 0 ? '#FFFFFF' : '#F8FAFC';
            doc.rect(startX, y, 495, rowHeight).fill(rowColor).stroke('#E2E8F0');

            const statusLabel = r.status === 'approved' ? 'Disetujui' : r.status === 'rejected' ? 'Ditolak' : 'Menunggu';
            const statusColor = r.status === 'approved' ? '#059669' : r.status === 'rejected' ? '#DC2626' : '#D97706';

            const tglMulai = new Date(r.start_date).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
            const tglSelesai = new Date(r.end_date).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });

            const cells = [
                idx + 1,
                r.leave_type_name || '-',
                tglMulai,
                tglSelesai,
                `${r.total_days} hr`,
                statusLabel
            ];

            x = startX;
            cells.forEach((val, i) => {
                doc.fillColor(i === 5 ? statusColor : '#1E293B');
                doc.font(i === 5 ? 'Helvetica-Bold' : 'Helvetica');
                doc.text(String(val), x + 4, y + 7, { width: colWidths[i] - 8, align: i === 0 ? 'center' : 'left' });
                x += colWidths[i];
            });

            y += rowHeight;

            // New page jika mendekati bawah
            if (y > 750) {
                doc.addPage();
                y = 50;
            }
        });
    }

    // --- Footer ---
    doc.moveDown(2);
    doc.fontSize(8).fillColor('#94A3B8').font('Helvetica').text('Dokumen ini digenerate secara otomatis oleh sistem Facultyware.', { align: 'center' });

    doc.end();
}

module.exports = { generateLeavePDF };
