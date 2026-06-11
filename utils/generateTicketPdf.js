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
                margin: 50
            });

            // Set headers for download
            res.setHeader('Content-disposition', `attachment; filename="Ticket-${registration.ticket_number}.pdf"`);
            res.setHeader('Content-type', 'application/pdf');

            doc.pipe(res);

            // Title
            doc.fontSize(24).font('Helvetica-Bold').text('E-TICKET', { align: 'center' });
            doc.moveDown();

            // Event Title
            doc.fontSize(20).font('Helvetica').text(registration.title, { align: 'center' });
            doc.moveDown(2);

            // Event Details
            doc.fontSize(12).font('Helvetica-Bold').text('Event Details:');
            doc.font('Helvetica').text(`Date: ${new Date(registration.start_date).toLocaleDateString('id-ID')}`);
            if (registration.start_time) {
                doc.text(`Time: ${registration.start_time}`);
            }
            doc.text(`Mode: ${registration.delivery_mode.toUpperCase()}`);
            if (registration.venue) {
                doc.text(`Venue: ${registration.venue}`);
            }
            if (registration.online_link) {
                doc.text(`Link: ${registration.online_link}`);
            }
            doc.moveDown();

            // Ticket Details
            doc.fontSize(12).font('Helvetica-Bold').text('Ticket Details:');
            doc.font('Helvetica').text(`Ticket Number: ${registration.ticket_number}`);
            doc.text(`Registration Number: ${registration.registration_number}`);
            doc.text(`Status: ${registration.attendance_status.toUpperCase()}`);
            doc.moveDown(2);

            // QR Code
            try {
                const qrDataUri = await generateQrCode(registration.ticket_number);
                if (qrDataUri) {
                    // Extract base64 part
                    const base64Data = qrDataUri.replace(/^data:image\/png;base64,/, "");
                    const imageBuffer = Buffer.from(base64Data, 'base64');
                    
                    // Draw image centered
                    doc.image(imageBuffer, (doc.page.width - 150) / 2, doc.y, { width: 150 });
                    doc.moveDown(10); // Move below image
                }
            } catch (qrErr) {
                console.error("Failed to add QR to PDF", qrErr);
            }

            // Footer
            doc.fontSize(10).fillColor('gray').text('Please present this ticket (QR Code) at the event.', { align: 'center' });

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
