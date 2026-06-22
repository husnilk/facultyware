var express = require("express");
var router = express.Router();

const receivingController = require("../controllers/receivingController");
const { checkPermission } = require("../middlewares/acl");
const upload = require("../middlewares/upload");

// Semua route Penerimaan Barang diproteksi permission 'manage_receiving'.
// Saat DEV_NO_AUTH=1 (lokal, non-production), guard dilewati untuk preview
// tampilan. Bypass TIDAK pernah aktif di production walau flag salah set.
const can =
  process.env.DEV_NO_AUTH === "1" && process.env.NODE_ENV !== "production"
    ? (req, res, next) => next()
    : checkPermission("manage_receiving");

/* ---- Halaman / aksi penerimaan (mount di /receiving) ---- */

// GET /receiving -> daftar penerimaan barang
router.get("/", can, receivingController.index);

// GET /receiving/:po_id/verify -> form verifikasi
router.get("/:po_id/verify", can, receivingController.verifyForm);

// POST /receiving/:po_id/verify -> simpan verifikasi (dengan upload bukti, maks 5 berkas)
router.post(
  "/:po_id/verify",
  can,
  upload.array("bukti", 5),
  receivingController.verifyStore
);

// POST /receiving/:po_id/confirm -> konfirmasi final (catat transaksi masuk ke buku besar)
router.post("/:po_id/confirm", can, receivingController.confirm);

// POST /receiving/retur -> catat retur barang ke vendor
router.post("/retur", can, receivingController.retur);

// POST /receiving/replacement -> catat barang ganti (replacement) dari vendor
router.post("/replacement", can, receivingController.replacement);

// GET /receiving/:id/detail -> detail penerimaan
router.get("/:id/detail", can, receivingController.detail);

// GET /receiving/:id/export -> export laporan PDF
router.get("/:id/export", can, receivingController.exportPDF);

/* ---- REST API (mount di /api/receiving) ---- */
// Dipisah agar URL final menjadi GET /api/receiving (JSON + pagination).
const apiRouter = express.Router();
apiRouter.get("/", can, receivingController.apiList);

router.apiRouter = apiRouter;

module.exports = router;
