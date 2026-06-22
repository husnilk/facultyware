const multer = require("multer");
const path = require("path");

/**
 * Middleware upload untuk Modul Penerimaan Barang.
 *
 * - Menyimpan bukti foto / surat jalan vendor ke disk.
 * - Destination : public/assets/uploads/receiving/
 * - Filename    : <timestamp>-<acak>.<ext asli>
 * - Filter      : hanya .jpg, .jpeg, .png, .pdf
 * - Limit       : maksimal 5MB per file
 */

const UPLOAD_DIR = path.join(
  __dirname,
  "..",
  "public",
  "assets",
  "uploads",
  "receiving"
);

const ALLOWED_EXT = [".jpg", ".jpeg", ".png", ".pdf"];
const ALLOWED_MIME = [
  "image/jpeg",
  "image/png",
  "application/pdf",
];

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOAD_DIR);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    // Suffix acak agar tidak tabrakan saat beberapa berkas diunggah
    // pada milidetik yang sama (endpoint ini menerima multi-file).
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `${unique}${ext}`);
  },
});

const fileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();
  const mimeOk = ALLOWED_MIME.includes(file.mimetype);
  const extOk = ALLOWED_EXT.includes(ext);

  if (mimeOk && extOk) {
    return cb(null, true);
  }
  cb(new Error("Format file tidak didukung. Hanya .jpg, .jpeg, .png, .pdf."));
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
  },
});

module.exports = upload;
