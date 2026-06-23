const QRCode = require('qrcode');

/**
 * Generate QR code as a Data URI string
 * @param {string} text - The text to encode in the QR code
 * @returns {Promise<string>} - Promise resolving to Data URI string
 */
const generateQrCode = async (text) => {
    try {
        const qrDataUri = await QRCode.toDataURL(text);
        return qrDataUri;
    } catch (err) {
        console.error('Error generating QR code:', err);
        return null;
    }
};

module.exports = generateQrCode;
