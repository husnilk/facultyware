const PDFDocument = require('pdfkit');
const generateQrCode = require('./generateQrCode');

/**
 * Generate a PDF ticket and pipe it to the response
 * @param {Object} registration - The registration data containing event and ticket info
 * @param {Object} res - Express response object to pipe the PDF to
 */
const generateTicketPdf = async (registration, res) => {
    return new Promise(async (resolve, reject) => {
        try {
            const doc = new PDFDocument({
                size: 'A4',
                margin: 40
            });

            // Set headers for download
            res.setHeader('Content-disposition', `attachment; filename="Ticket-${registration.ticket_number}.pdf"`);
            res.setHeader('Content-type', 'application/pdf');

            doc.pipe(res);

            // ==========================================
            // TICKET CONTAINER
            // ==========================================
            const ticketX = 40;
            const ticketY = 60;
            const ticketW = 515;
            const ticketH = 340;

            // Draw Ticket Card border
            doc.roundedRect(ticketX, ticketY, ticketW, ticketH, 8)
               .lineWidth(1)
               .strokeColor('#E2E8F0')
               .stroke();

            // Draw Header Banner with top rounded corners
            doc.save();
            doc.roundedRect(ticketX, ticketY, ticketW, 50, 8)
               .fill('#0F172A');
            // Cover bottom corners of the header to make them square
            doc.rect(ticketX, ticketY + 25, ticketW, 25)
               .fill('#0F172A');
            doc.restore();

            // Header Content
            doc.fillColor('#FFFFFF')
               .fontSize(16)
               .font('Helvetica-Bold')
               .text('E-TICKET', ticketX + 20, ticketY + 18);

            doc.fillColor('#0D9488')
               .fontSize(11)
               .font('Helvetica-Bold')
               .text('FACULTYWARE', ticketX + 380, ticketY + 20, { align: 'right', width: 110 });

            // Vertical Stub Divider
            const dividerX = 370;
            doc.save();
            doc.moveTo(dividerX, ticketY + 50)
               .lineTo(dividerX, ticketY + ticketH - 10)
               .lineWidth(1.5)
               .dash(4, { space: 4 })
               .strokeColor('#CBD5E1')
               .stroke();
            doc.restore();

            // Hole Punches / Ticket Cut-outs
            // Top Cut-out
            doc.circle(dividerX, ticketY, 10).fill('#FFFFFF');
            // Bottom Cut-out
            doc.circle(dividerX, ticketY + ticketH, 10).fill('#FFFFFF');

            // ==========================================
            // LEFT SECTION: EVENT DETAILS
            // ==========================================
            const leftX = ticketX + 20;
            
            // Event Title
            doc.fillColor('#0F172A')
               .fontSize(14)
               .font('Helvetica-Bold')
               .text(registration.title, leftX, ticketY + 75, { width: 290, lineGap: 3 });

            // Calculate current Y after title
            const titleHeight = doc.heightOfString(registration.title, { width: 290, lineGap: 3 });
            const detailsStartY = ticketY + 75 + titleHeight + 20;

            // Date & Time
            const formattedDate = new Date(registration.start_date).toLocaleDateString('id-ID', {
                weekday: 'long',
                day: 'numeric',
                month: 'long',
                year: 'numeric'
            });
            const timeStr = registration.start_time ? `${registration.start_time} WIB` : 'Sesuai jadwal';

            doc.fillColor('#64748B')
               .fontSize(8)
               .font('Helvetica-Bold')
               .text('WAKTU & TANGGAL / DATE & TIME', leftX, detailsStartY);

            doc.fillColor('#1E293B')
               .fontSize(10)
               .font('Helvetica')
               .text(`${formattedDate}\n${timeStr}`, leftX, detailsStartY + 12, { lineGap: 2 });

            // Venue / Location
            const venueY = detailsStartY + 55;
            const venueText = registration.delivery_mode === 'online' 
                ? `Online Event (Link: ${registration.online_link || 'Akan diinfokan'})` 
                : (registration.venue || 'Offline Venue');

            doc.fillColor('#64748B')
               .fontSize(8)
               .font('Helvetica-Bold')
               .text('LOKASI / VENUE', leftX, venueY);

            doc.fillColor('#1E293B')
               .fontSize(10)
               .font('Helvetica')
               .text(venueText, leftX, venueY + 12, { width: 290, lineGap: 2 });

            // Registration ID & Participant Info
            const regY = venueY + 55;
            
            // Left col: Registration ID
            doc.fillColor('#64748B')
               .fontSize(7.5)
               .font('Helvetica-Bold')
               .text('NO. REGISTRASI / REGISTRATION NO.', leftX, regY, { width: 140 });

            doc.fillColor('#1E293B')
               .fontSize(9.5)
               .font('Helvetica-Bold')
               .text(registration.registration_number, leftX, regY + 18, { width: 140 });

            // Right col: Participant Name
            doc.fillColor('#64748B')
               .fontSize(7.5)
               .font('Helvetica-Bold')
               .text('NAMA PESERTA / PARTICIPANT', leftX + 150, regY, { width: 140 });

            doc.fillColor('#1E293B')
               .fontSize(9.5)
               .font('Helvetica-Bold')
               .text(registration.full_name || '-', leftX + 150, regY + 18, { width: 140, height: 25, ellipsis: true });

            // ==========================================
            // RIGHT SECTION: TICKET STUB
            // ==========================================
            const rightX = dividerX + 15;
            const rightW = ticketX + ticketW - rightX - 20;

            // QR Code
            try {
                const qrDataUri = await generateQrCode(registration.ticket_number);
                if (qrDataUri) {
                    const base64Data = qrDataUri.replace(/^data:image\/png;base64,/, "");
                    const imageBuffer = Buffer.from(base64Data, 'base64');
                    
                    const qrSize = 110;
                    const qrX = dividerX + (ticketX + ticketW - dividerX - qrSize) / 2;
                    doc.image(imageBuffer, qrX, ticketY + 75, { width: qrSize, height: qrSize });
                }
            } catch (qrErr) {
                console.error("Failed to add QR to PDF", qrErr);
                doc.fillColor('#EF4444')
                   .fontSize(8)
                   .text('[Gagal memuat QR Code]', rightX, ticketY + 100, { align: 'center', width: rightW });
            }

            // Ticket Number
            const ticketNumY = ticketY + 210;
            doc.fillColor('#64748B')
               .fontSize(8)
               .font('Helvetica-Bold')
               .text('NOMOR TIKET / TICKET NO.', dividerX, ticketNumY, { align: 'center', width: ticketX + ticketW - dividerX });

            doc.fillColor('#0F172A')
               .fontSize(11)
               .font('Helvetica-Bold')
               .text(registration.ticket_number, dividerX, ticketNumY + 12, { align: 'center', width: ticketX + ticketW - dividerX });

            // Status Badge
            const badgeY = ticketNumY + 38;
            const badgeW = 90;
            const badgeH = 20;
            const badgeX = dividerX + (ticketX + ticketW - dividerX - badgeW) / 2;

            // Draw rounded badge background
            doc.roundedRect(badgeX, badgeY, badgeW, badgeH, 4)
               .fill('#E6F4F1');

            // Text inside badge
            doc.fillColor('#0D9488')
               .fontSize(8)
               .font('Helvetica-Bold')
               .text(registration.attendance_status.toUpperCase(), badgeX, badgeY + 6, { align: 'center', width: badgeW });

            // ==========================================
            // REGISTRANT DETAILS BOX
            // ==========================================
            const detailBoxY = ticketY + ticketH + 20;
            const detailBoxH = 75;

            // Draw light background card
            doc.roundedRect(ticketX, detailBoxY, ticketW, detailBoxH, 6)
               .fill('#F8FAFC');

            // Draw border
            doc.roundedRect(ticketX, detailBoxY, ticketW, detailBoxH, 6)
               .lineWidth(0.5)
               .strokeColor('#E2E8F0')
               .stroke();

            // Box Title
            doc.fillColor('#0F172A')
               .fontSize(9)
               .font('Helvetica-Bold')
               .text('DETAIL PESERTA / PARTICIPANT DETAILS', ticketX + 15, detailBoxY + 10);

            // Details Grid (4 columns/fields)
            const colW = (ticketW - 30) / 4; // ~121pt each
            
            // Col 1: Email
            doc.fillColor('#64748B')
               .fontSize(7.5)
               .font('Helvetica-Bold')
               .text('EMAIL', ticketX + 15, detailBoxY + 28);
            doc.fillColor('#1E293B')
               .fontSize(8.5)
               .font('Helvetica')
               .text(registration.email || '-', ticketX + 15, detailBoxY + 38, { width: colW - 10, height: 25, ellipsis: true });

            // Col 2: Telepon
            doc.fillColor('#64748B')
               .fontSize(7.5)
               .font('Helvetica-Bold')
               .text('TELEPON / PHONE', ticketX + 15 + colW, detailBoxY + 28);
            doc.fillColor('#1E293B')
               .fontSize(8.5)
               .font('Helvetica')
               .text(registration.phone || '-', ticketX + 15 + colW, detailBoxY + 38, { width: colW - 10, height: 25, ellipsis: true });

            // Col 3: Alamat
            doc.fillColor('#64748B')
               .fontSize(7.5)
               .font('Helvetica-Bold')
               .text('ALAMAT / ADDRESS', ticketX + 15 + colW * 2, detailBoxY + 28);
            doc.fillColor('#1E293B')
               .fontSize(8.5)
               .font('Helvetica')
               .text(registration.address || '-', ticketX + 15 + colW * 2, detailBoxY + 38, { width: colW - 10, height: 25, ellipsis: true });

            // Col 4: Catatan
            doc.fillColor('#64748B')
               .fontSize(7.5)
               .font('Helvetica-Bold')
               .text('CATATAN / NOTES', ticketX + 15 + colW * 3, detailBoxY + 28);
            doc.fillColor('#1E293B')
               .fontSize(8.5)
               .font('Helvetica')
               .text(registration.notes || '-', ticketX + 15 + colW * 3, detailBoxY + 38, { width: colW - 10, height: 25, ellipsis: true });

            // ==========================================
            // INSTRUCTIONS / TERMS
            // ==========================================
            const instructionsY = detailBoxY + detailBoxH + 20;

            doc.fillColor('#0F172A')
               .fontSize(11)
               .font('Helvetica-Bold')
               .text('INFORMASI PENTING / IMPORTANT INFORMATION', ticketX, instructionsY);

            // List of instructions
            const instructions = [
                'Tunjukkan QR Code pada tiket ini di lokasi acara untuk melakukan pemindaian check-in.',
                'Harap datang paling lambat 15 menit sebelum acara dimulai.',
                'Tiket ini hanya berlaku untuk satu orang sesuai dengan nama pendaftar.',
                'Dilarang menyebarluaskan QR Code tiket Anda untuk mencegah penyalahgunaan.'
            ];

            let currInstY = instructionsY + 20;
            instructions.forEach((inst, index) => {
                doc.fillColor('#0D9488')
                   .fontSize(9)
                   .font('Helvetica-Bold')
                   .text(`${index + 1}.`, ticketX, currInstY, { width: 15 });

                doc.fillColor('#475569')
                   .fontSize(9)
                   .font('Helvetica')
                   .text(inst, ticketX + 15, currInstY, { width: ticketW - 15, lineGap: 2 });
                
                const instHeight = doc.heightOfString(inst, { width: ticketW - 15, lineGap: 2 });
                currInstY += instHeight + 8;
            });

            // ==========================================
            // FOOTER BRANDING
            // ==========================================
            doc.save();
            doc.moveTo(ticketX, 760)
               .lineTo(ticketX + ticketW, 760)
               .lineWidth(0.5)
               .strokeColor('#E2E8F0')
               .stroke();
            doc.restore();

            doc.fillColor('#94A3B8')
               .fontSize(8)
               .font('Helvetica')
               .text('Generated by Facultyware Event Platform • Copyright © 2026', ticketX, 770, { align: 'center', width: ticketW });

            doc.end();
            
            // Wait for stream to finish
            res.on('finish', () => resolve());
            res.on('error', (err) => reject(err));

        } catch (err) {
            console.error('Error generating PDF:', err);
            reject(err);
        }
    });
};

module.exports = generateTicketPdf;
