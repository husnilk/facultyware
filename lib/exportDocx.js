const { Document, Packer, Paragraph, Table, TableRow, TableCell, TextRun, WidthType } = require('docx');

exports.generate = async (leaveRequests) => {
    // 1. Buat Baris Header Tabel
    const tableRows = [
        new TableRow({
            children: [
                new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Nama Pegawai", bold: true })] })] }),
                new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Jenis Cuti", bold: true })] })] }),
                new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Tanggal Mulai", bold: true })] })] }),
                new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Tanggal Selesai", bold: true })] })] }),
                new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Status", bold: true })] })] }),
            ],
        }),
    ];

    // 2. Buat Baris Isi Data (Looping)
    leaveRequests.forEach(request => {
        const startDate = new Date(request.start_date).toLocaleDateString('id-ID');
        const endDate = new Date(request.end_date).toLocaleDateString('id-ID');
        
        let status = 'Menunggu';
        if (request.status === 'approved') status = 'Disetujui';
        if (request.status === 'rejected') status = 'Ditolak';

        tableRows.push(
            new TableRow({
                children: [
                    new TableCell({ children: [new Paragraph(request.employee_name)] }),
                    new TableCell({ children: [new Paragraph(request.leave_type)] }),
                    new TableCell({ children: [new Paragraph(startDate)] }),
                    new TableCell({ children: [new Paragraph(endDate)] }),
                    new TableCell({ children: [new Paragraph(status)] }),
                ],
            })
        );
    });

    // 3. Bungkus menjadi Tabel penuh
    const table = new Table({
        rows: tableRows,
        width: { size: 100, type: WidthType.PERCENTAGE },
    });

    // 4. Susun Dokumen Utama
    const doc = new Document({
        sections: [
            {
                properties: {},
                children: [
                    new Paragraph({
                        children: [
                            new TextRun({ text: "Rekapitulasi Data Cuti", bold: true, size: 32 }),
                        ],
                        spacing: { after: 300 }, // Memberi jarak ke tabel
                    }),
                    table,
                ],
            },
        ],
    });

    // 5. Ekspor menjadi file biner (Buffer)
    const buffer = await Packer.toBuffer(doc);
    return buffer;
};