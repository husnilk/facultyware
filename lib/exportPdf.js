const PDFDocument = require('pdfkit');

exports.generate = (leaveRequests) => {
    // Buat dokumen PDF baru dengan margin
    const doc = new PDFDocument({ margin: 30, size: 'A4' });
    
    // Judul Laporan
    doc.fontSize(18).font('Helvetica-Bold').text('Rekapitulasi Data Cuti', { align: 'center' });
    doc.moveDown(2);

    // Konfigurasi Kolom Tabel
    const tableTop = 100;
    const col1 = 30;  // Nama
    const col2 = 180; // Jenis Cuti
    const col3 = 280; // Tgl Mulai
    const col4 = 370; // Tgl Selesai
    const col5 = 460; // Status

    // Header Tabel
    doc.fontSize(10).font('Helvetica-Bold');
    doc.text('Nama Pegawai', col1, tableTop);
    doc.text('Jenis Cuti', col2, tableTop);
    doc.text('Tanggal Mulai', col3, tableTop);
    doc.text('Tanggal Selesai', col4, tableTop);
    doc.text('Status', col5, tableTop);
    
    // Garis Bawah Header Tabel
    doc.moveTo(col1, tableTop + 15).lineTo(560, tableTop + 15).stroke();

    // Isi Baris Tabel
    doc.font('Helvetica');
    let yPosition = tableTop + 25;
    
    leaveRequests.forEach(request => {
        // Jika sudah mencapai batas bawah halaman, buat halaman baru
        if (yPosition > 750) {
            doc.addPage();
            yPosition = 50;
        }
        
        const startDate = new Date(request.start_date).toLocaleDateString('id-ID');
        const endDate = new Date(request.end_date).toLocaleDateString('id-ID');
        
        let status = 'Menunggu';
        if (request.status === 'approved') status = 'Disetujui';
        if (request.status === 'rejected') status = 'Ditolak';

        doc.text(request.employee_name, col1, yPosition);
        doc.text(request.leave_type, col2, yPosition);
        doc.text(startDate, col3, yPosition);
        doc.text(endDate, col4, yPosition);
        doc.text(status, col5, yPosition);
        
        // Tambahkan garis tipis pemisah tiap baris
        doc.lineWidth(0.5).moveTo(col1, yPosition + 15).lineTo(560, yPosition + 15).stroke();
        
        yPosition += 25;
    });

    return doc;
};