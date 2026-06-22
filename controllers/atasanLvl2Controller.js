const cutiModel = require('../models/cutiModel');
const PDFDocument = require('pdfkit');

exports.index = (req, res) => {
    res.redirect('/atasan-lvl2/cuti/pending');
};

exports.pendingCuti = async (req, res) => {
    try {
        const search = req.query.search || '';
        const requests = await cutiModel.getPendingLeaveRequestsLvl2(search);

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
        if (isNaN(id)) return res.status(400).send("ID pengajuan cuti tidak valid.");

        const requestDetail = await cutiModel.getLeaveRequestDetailLvl2(id);
        if (!requestDetail) return res.status(404).send("Data pengajuan cuti tidak ditemukan.");

        let approvals = [];
        try {
            approvals = await cutiModel.getLeaveApprovals(id);
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
    try {
        const id = parseInt(req.params.id, 10);
        if (isNaN(id)) return res.redirect('/atasan-lvl2/cuti/pending');
        
        // ID User langsung digunakan sebagai Approver ID (Tanpa query tambahan)
        const approverId = req.session.user.id;
        const notes = 'Pengajuan disetujui oleh Atasan Level 2.';

        await cutiModel.processLeaveApprovalLvl2(id, approverId, 'approved', notes);
        res.redirect('/atasan-lvl2/cuti/pending?success=approved');
        
    } catch (error) {
        console.error("Error at approveCuti:", error);
        if (error.message === 'ALREADY_PROCESSED') {
            return res.redirect(`/atasan-lvl2/cuti/${req.params.id}?error=already_processed`);
        }
        res.status(500).send("Terjadi kesalahan sistem.");
    }
};

exports.rejectCuti = async (req, res) => {
    try {
        const id = parseInt(req.params.id, 10);
        if (isNaN(id)) return res.redirect('/atasan-lvl2/cuti/pending');
        
        const notes = (req.body.notes || '').trim();
        if (!notes) return res.redirect(`/atasan-lvl2/cuti/${id}?error=notes_required`);
        
        // ID User langsung digunakan sebagai Approver ID (Tanpa query tambahan)
        const approverId = req.session.user.id;

        await cutiModel.processLeaveApprovalLvl2(id, approverId, 'rejected', notes);
        res.redirect('/atasan-lvl2/cuti/pending?success=rejected');
        
    } catch (error) {
        console.error("Error at rejectCuti:", error);
        if (error.message === 'ALREADY_PROCESSED') {
            return res.redirect(`/atasan-lvl2/cuti/${req.params.id}?error=already_processed`);
        }
        res.status(500).send("Terjadi kesalahan sistem.");
    }
};

exports.apiGetPendingCuti = async (req, res) => {
    try {
        const search = req.query.search || '';
        const requests = await cutiModel.getPendingLeaveRequestsLvl2(search);

        res.json({
            success: true,
            message: "Data pengajuan cuti pending berhasil diambil.",
            filters: { search: search },
            total: requests.length,
            data: requests
        });
    } catch (error) {
        console.error("Error at apiGetPendingCuti:", error);
        res.status(500).json({ success: false, message: "Terjadi kesalahan server.", error: error.message });
    }
};

exports.apiGetDetailCuti = async (req, res) => {
    try {
        const id = parseInt(req.params.id, 10);
        if (isNaN(id)) return res.status(400).json({ success: false, message: "ID tidak valid." });

        const requestDetail = await cutiModel.getLeaveRequestDetailLvl2(id);
        if (!requestDetail) return res.status(404).json({ success: false, message: "Data tidak ditemukan." });

        try {
            requestDetail.approvals = await cutiModel.getLeaveApprovals(id);
        } catch (err) {
            console.warn("Error getting approvals:", err.message);
        }

        res.json({ success: true, message: "Detail pengajuan cuti berhasil diambil.", data: requestDetail });
    } catch (error) {
        console.error("Error at apiGetDetailCuti:", error);
        res.status(500).json({ success: false, message: "Terjadi kesalahan server.", error: error.message });
    }
};

const formatDatePdf = (dateValue) => {
    if (!dateValue) return '-';
    return new Date(dateValue).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' });
};

const getPrintedDate = () => {
    return new Date().toLocaleString('id-ID', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' });
};

exports.exportRiwayatPdf = async (req, res) => {
    try {
        const data = await cutiModel.getRiwayatApprovalPdfDataLvl2();

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 'attachment; filename="riwayat-approval-atasan-level-2.pdf"');

        const doc = new PDFDocument({ margin: 35, size: 'A4', layout: 'landscape', bufferPages: true });
        doc.pipe(res);

        doc.fontSize(20).font('Helvetica-Bold').fillColor('#000000').text('FACULTYWARE', { align: 'center' });
        doc.fontSize(12).font('Helvetica').text('Sistem Pengajuan Cuti Pegawai', { align: 'center' });
        doc.moveDown(0.5);
        doc.moveTo(35, doc.y).lineTo(807, doc.y).lineWidth(1).strokeColor('#000000').stroke();
        doc.moveDown(1);
        doc.fontSize(14).font('Helvetica-Bold').text('LAPORAN RIWAYAT APPROVAL CUTI ATASAN LEVEL 2', { align: 'center' });
        doc.moveDown(1.5);

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

        doc.font('Helvetica-Bold').text('Ringkasan:', 600, startYInfo);
        doc.font('Helvetica').text(`Approved`, 600, startYInfo + 15, { continued: true }).text(`: ${approvedCount}`, 660, startYInfo + 15);
        doc.text(`Rejected`, 600, startYInfo + 30, { continued: true }).text(`: ${rejectedCount}`, 660, startYInfo + 30);
        doc.font('Helvetica-Bold').text(`Total`, 600, startYInfo + 45, { continued: true }).text(`: ${data.length}`, 660, startYInfo + 45);

        doc.y = startYInfo + 90;

        if (data.length === 0) {
            doc.fontSize(11).font('Helvetica-Oblique').text('Belum ada riwayat pengajuan cuti yang berstatus approved atau rejected.', 35, doc.y, { align: 'center' });
        } else {
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
        if (!res.headersSent) return res.status(500).send('Terjadi kesalahan saat membuat file PDF.');
    }
};