// Controller Modul Penerimaan Barang (Penerimaan / Receiving)
// Oleh: Mikail (2411523016) - Kelompok B09
//
// Aturan:
// - Native mysql2 (TANPA ORM). pool sudah berupa pool.promise() dari lib/db.js.
// - Selalu pakai prepared statement: pool.query(sql, [params]).
// - Tabel yang dipakai:
//   inventory_purchases, inventory_purchase_items, inventory_transactions,
//   inventories, items, inventory_receiving_attachments.
//   (inventory_receiving_attachments + kolom verifikasi per item ditambahkan
//    via scripts/migrate_receiving_schema.js, dengan izin perubahan skema.)

const pool = require("../lib/db");
const PDFDocument = require("pdfkit");
const { resolveSort, toSelectOptions } = require("../lib/sort");

const PAGE_SIZE = 10;

// Opsi urutan daftar penerimaan (whitelist aman untuk ORDER BY).
const RECEIVING_SORTS = {
  terbaru:  { label: "Terbaru",        orderBy: "purchase_date DESC, id DESC" },
  terlama:  { label: "Terlama",        orderBy: "purchase_date ASC, id ASC" },
  supplier: { label: "Supplier (A-Z)", orderBy: "supplier ASC, id DESC" },
  status:   { label: "Status",         orderBy: "status ASC, id DESC" },
};

// Label status PO ke bahasa tampilan. Alur 2-gerbang: PO 'pending' (menunggu
// persetujuan Wadir) -> 'approved' (siap diterima) -> 'completed' (selesai).
// Hanya PO 'approved' yang boleh diverifikasi & dikonfirmasi di modul ini.
const STATUS_LABEL = {
  draft: "Draf",
  pending: "Menunggu Persetujuan",
  approved: "Menunggu Penerimaan",
  rejected: "Ditolak",
  completed: "Selesai",
};

// Format tanggal (DATE) ke dd-mm-yyyy berdasarkan waktu lokal (hindari geser UTC).
function fmtDate(value) {
  if (!value) return "-";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "-";
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  return `${dd}-${mm}-${d.getFullYear()}`;
}

// Format angka ke Rupiah (mis. 55000 -> "Rp 55.000").
function fmtRp(n) {
  return "Rp " + Number(n || 0).toLocaleString("id-ID");
}

// Bangun klausa pencarian opsional (purchase_number / supplier).
function buildSearch(q) {
  const term = (q || "").trim();
  if (!term) return { where: "", params: [] };
  return {
    where: "WHERE purchase_number LIKE ? OR supplier LIKE ?",
    params: [`%${term}%`, `%${term}%`],
  };
}

/**
 * GET /receiving
 * Daftar penerimaan barang (list PO) + pencarian + pagination.
 */
const index = async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const offset = (page - 1) * PAGE_SIZE;
    const search = (req.query.q || "").trim();
    const { where, params } = buildSearch(search);

    // Hanya PO yang relevan untuk penerimaan: sudah disetujui (siap diterima)
    // atau sudah selesai. PO 'pending'/'draft'/'rejected' tidak ditampilkan.
    const statusClause = where
      ? `${where} AND status IN ('approved','completed')`
      : `WHERE status IN ('approved','completed')`;
    const sort = resolveSort(req.query.sort, RECEIVING_SORTS, "terbaru");

    const [rows] = await pool.query(
      `SELECT id, purchase_number, supplier, purchase_date, status
       FROM inventory_purchases
       ${statusClause}
       ORDER BY ${sort.orderBy}
       LIMIT ? OFFSET ?`,
      [...params, PAGE_SIZE, offset]
    );

    const [[{ total }]] = await pool.query(
      `SELECT COUNT(*) AS total FROM inventory_purchases ${statusClause}`,
      params
    );

    const data = rows.map((r) => ({
      ...r,
      purchase_date: fmtDate(r.purchase_date),
      status_label: STATUS_LABEL[r.status] || r.status,
    }));

    res.render("receiving/index", {
      title: "Penerimaan Barang",
      user: req.session.username,
      rows: data,
      search,
      page,
      totalPages: Math.max(1, Math.ceil(total / PAGE_SIZE)),
      sort: sort.key,
      sortOptions: toSelectOptions(RECEIVING_SORTS),
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /receiving/:po_id/verify
 * Form verifikasi kecocokan fisik barang dengan dokumen PO.
 */
const verifyForm = async (req, res, next) => {
  try {
    const poId = req.params.po_id;

    const [poRows] = await pool.query(
      `SELECT id, purchase_number, supplier, purchase_date, status
       FROM inventory_purchases WHERE id = ?`,
      [poId]
    );
    const po = poRows[0]
      ? {
          ...poRows[0],
          purchase_date: fmtDate(poRows[0].purchase_date),
          status_label: STATUS_LABEL[poRows[0].status] || poRows[0].status,
        }
      : null;

    // Hanya PO yang sudah disetujui (approved) yang boleh diverifikasi.
    // Yang sudah 'completed' -> ke detail; selain 'approved' -> kembali ke daftar.
    if (po && po.status === "completed") {
      return res.redirect(`/receiving/${poId}/detail`);
    }
    if (!po || po.status !== "approved") {
      return res.redirect(`/receiving`);
    }

    const [items] = await pool.query(
      `SELECT ipi.id, ipi.quantity, ipi.price, it.name, it.code, it.unit
       FROM inventory_purchase_items ipi
       JOIN items it ON it.id = ipi.item_id
       WHERE ipi.inventory_purchase_id = ?
       ORDER BY ipi.id`,
      [poId]
    );

    let totalValue = 0;
    items.forEach((i) => {
      totalValue += (Number(i.price) || 0) * Number(i.quantity);
    });
    const summary = {
      itemCount: items.length,
      totalValue_label: fmtRp(totalValue),
    };

    res.render("receiving/verify", {
      title: "Verifikasi Penerimaan",
      user: req.session.username,
      po,
      items,
      summary,
    });
  } catch (err) {
    next(err);
  }
};

// Ambil nilai field array dari form (mis. name="received_qty[12]").
// Tahan untuk dua bentuk hasil parser: nested object atau key flat.
function pickField(body, group, id) {
  const nested = body[group];
  if (nested && typeof nested === "object" && nested[id] != null) {
    return nested[id];
  }
  return body[`${group}[${id}]`];
}

/**
 * POST /receiving/:po_id/verify
 * Simpan hasil verifikasi (qty diterima, kondisi, keterangan) per item
 * + simpan path tiap bukti (req.files dari upload.array).
 */
const verifyStore = async (req, res, next) => {
  const poId = req.params.po_id;
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    // Pastikan PO ada (dan ambil daftar item miliknya).
    const [poRows] = await conn.query(
      "SELECT id, status FROM inventory_purchases WHERE id = ?",
      [poId]
    );
    if (poRows.length === 0) {
      await conn.rollback();
      return res.status(404).render("error", {
        message: "Purchase order tidak ditemukan.",
        error: { status: 404, stack: "" },
      });
    }

    // Tolak verifikasi bila PO sudah dikonfirmasi (completed): transaksi
    // ledger sudah terbentuk, mengubah angka verifikasi akan membuat
    // verifikasi vs buku besar tidak konsisten.
    if (poRows[0].status === "completed") {
      await conn.rollback();
      return res.status(409).render("error", {
        message: "PO sudah dikonfirmasi (Selesai); verifikasi tidak bisa diubah.",
        error: { status: 409, stack: "" },
      });
    }
    // Hanya PO yang sudah disetujui Wadir yang boleh diverifikasi.
    if (poRows[0].status !== "approved") {
      await conn.rollback();
      return res.status(409).render("error", {
        message: "PO belum disetujui; tidak bisa diverifikasi.",
        error: { status: 409, stack: "" },
      });
    }

    const [items] = await conn.query(
      "SELECT id, quantity FROM inventory_purchase_items WHERE inventory_purchase_id = ?",
      [poId]
    );

    // Simpan hasil verifikasi per item: pisah jumlah BAIK & CACAT.
    for (const item of items) {
      let goodQty = parseInt(pickField(req.body, "good_qty", item.id), 10);
      if (!Number.isInteger(goodQty) || goodQty < 0) {
        goodQty = item.quantity; // default: semua dianggap baik = jumlah dipesan
      }

      let defectiveQty = parseInt(pickField(req.body, "defective_qty", item.id), 10);
      if (!Number.isInteger(defectiveQty) || defectiveQty < 0) {
        defectiveQty = 0;
      }

      const note = (pickField(req.body, "notes", item.id) || "").toString().trim() || null;

      await conn.query(
        `UPDATE inventory_purchase_items
            SET received_quantity = ?, received_defective = ?, received_note = ?, updated_at = NOW()
          WHERE id = ? AND inventory_purchase_id = ?`,
        [goodQty, defectiveQty, note, item.id, poId]
      );
    }

    // Simpan tiap berkas bukti (jika ada).
    const files = Array.isArray(req.files) ? req.files : [];
    for (const f of files) {
      await conn.query(
        `INSERT INTO inventory_receiving_attachments
           (inventory_purchase_id, file_path, original_name, mime_type, size, created_at)
         VALUES (?, ?, ?, ?, ?, NOW())`,
        [poId, f.filename, f.originalname, f.mimetype, f.size]
      );
    }

    await conn.commit();
    res.redirect(`/receiving/${poId}/detail`);
  } catch (err) {
    await conn.rollback();
    next(err);
  } finally {
    conn.release();
  }
};

/**
 * POST /receiving/:po_id/confirm
 * Konfirmasi penerimaan final -> auto-update stok.
 */
const confirm = async (req, res, next) => {
  const id = req.params.po_id;
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    // Kunci baris PO selama transaksi.
    const [poRows] = await conn.query(
      "SELECT id, purchase_number, status FROM inventory_purchases WHERE id = ? FOR UPDATE",
      [id]
    );
    if (poRows.length === 0) {
      await conn.rollback();
      return res.status(404).render("error", {
        message: "Purchase order tidak ditemukan.",
        error: { status: 404, stack: "" },
      });
    }
    const po = poRows[0];

    // Idempoten: kalau sudah 'completed', jangan tambah stok dua kali.
    if (po.status === "completed") {
      await conn.rollback();
      return res.redirect(`/receiving/${id}/detail`);
    }
    // Hanya PO yang sudah disetujui Wadir yang boleh dikonfirmasi diterima.
    if (po.status !== "approved") {
      await conn.rollback();
      return res.status(409).render("error", {
        message: "PO belum disetujui; tidak bisa dikonfirmasi.",
        error: { status: 409, stack: "" },
      });
    }

    // Model buku besar: semua barang FISIK yang datang (baik + cacat) masuk stok.
    // Barang cacat yang dikirim balik nanti dikeluarkan lewat retur, sehingga
    // stok selalu = Σmasuk − Σkeluar. Jika belum diverifikasi, pakai jumlah dipesan.
    const [rawItems] = await conn.query(
      `SELECT item_id, quantity, received_quantity, received_defective
         FROM inventory_purchase_items
        WHERE inventory_purchase_id = ?`,
      [id]
    );
    const items = rawItems.map((it) => {
      const verified = it.received_quantity != null || it.received_defective != null;
      const physical = verified
        ? Number(it.received_quantity || 0) + Number(it.received_defective || 0)
        : Number(it.quantity);
      return { item_id: it.item_id, quantity: physical };
    });

    const now = new Date();
    const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;

    for (const it of items) {
      // Catat transaksi barang masuk (type='in'), referensi = No PO.
      // CATATAN: modul Penerimaan (B9) HANYA mencatat transaksi; pembaruan
      // angka stok (tabel inventories) adalah tanggung jawab modul Stok Opname (B11).
      await conn.query(
        `INSERT INTO inventory_transactions
           (item_id, type, quantity, transaction_date, reference, notes, created_at, updated_at)
         VALUES (?, 'in', ?, ?, ?, 'Penerimaan barang dikonfirmasi', NOW(), NOW())`,
        [it.item_id, it.quantity, today, po.purchase_number]
      );
    }

    // Tandai PO selesai.
    await conn.query(
      "UPDATE inventory_purchases SET status = 'completed', updated_at = NOW() WHERE id = ?",
      [id]
    );

    // Tutup loop: tandai SEMUA permintaan yang tergabung pada pengadaan PO ini
    // sebagai 'fulfilled'. Satu pengadaan bisa mengkonsolidasi banyak permintaan
    // (inventory_requests.inventory_procurement_id), jadi many->one.
    // Tidak menyentuh tabel inventories (milik B11).
    const [poInfo] = await conn.query(
      "SELECT inventory_procurement_id FROM inventory_purchases WHERE id = ?",
      [id]
    );
    const procurementId = poInfo[0] ? poInfo[0].inventory_procurement_id : null;
    if (procurementId != null) {
      await conn.query(
        "UPDATE inventory_requests SET status = 'fulfilled', updated_at = NOW() WHERE inventory_procurement_id = ? AND status = 'approved'",
        [procurementId]
      );
    }

    await conn.commit();
    res.redirect(`/receiving/${id}/detail`);
  } catch (err) {
    await conn.rollback();
    next(err);
  } finally {
    conn.release();
  }
};

/**
 * POST /receiving/retur
 * Catat retur barang ke vendor.
 */
// Label alasan retur (value dropdown -> teks tampilan).
const RETUR_REASON_LABEL = {
  cacat: "Barang cacat / rusak",
  salah_kirim: "Salah kirim / tidak sesuai spesifikasi",
  kelebihan: "Kelebihan kirim",
  kedaluwarsa: "Kedaluwarsa",
  lainnya: "Lainnya",
};

const retur = async (req, res, next) => {
  const poId = req.body.po_id;
  const itemId = req.body.item_id;
  const qty = parseInt(req.body.quantity, 10);
  const reasonLabel = RETUR_REASON_LABEL[req.body.reason] || "Lainnya";
  const detail = (req.body.notes || "").trim();

  // Validasi dasar.
  if (!poId || !itemId || !Number.isInteger(qty) || qty <= 0) {
    return res.status(400).render("error", {
      message: "Data retur tidak valid (item & jumlah wajib diisi).",
      error: { status: 400, stack: "" },
    });
  }

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const [poRows] = await conn.query(
      "SELECT purchase_number, status FROM inventory_purchases WHERE id = ?",
      [poId]
    );
    if (poRows.length === 0) {
      await conn.rollback();
      return res.status(404).render("error", {
        message: "Purchase order tidak ditemukan.",
        error: { status: 404, stack: "" },
      });
    }
    // Penerimaan yang sudah final (completed) terkunci: tidak bisa retur lagi.
    if (poRows[0].status === "completed") {
      await conn.rollback();
      return res.status(409).render("error", {
        message: "Penerimaan sudah final (Selesai); retur tidak dapat dicatat lagi.",
        error: { status: 409, stack: "" },
      });
    }
    const purchaseNumber = poRows[0].purchase_number;

    // Validasi jumlah: tidak boleh meretur lebih dari yang benar-benar dimiliki.
    // "Dimiliki" = jumlah diterima saat verifikasi (baik + cacat), atau jumlah
    // dipesan bila belum diverifikasi; dikurangi jumlah yang sudah diretur.
    const [itemRows] = await conn.query(
      `SELECT quantity, received_quantity, received_defective
         FROM inventory_purchase_items
        WHERE inventory_purchase_id = ? AND item_id = ?`,
      [poId, itemId]
    );
    if (itemRows.length === 0) {
      await conn.rollback();
      return res.status(400).render("error", {
        message: "Barang tidak terdaftar pada purchase order ini.",
        error: { status: 400, stack: "" },
      });
    }
    const it = itemRows[0];
    const verified = it.received_quantity != null || it.received_defective != null;
    const owned = verified
      ? Number(it.received_quantity || 0) + Number(it.received_defective || 0)
      : Number(it.quantity);
    const [[{ returned }]] = await conn.query(
      `SELECT COALESCE(SUM(quantity), 0) AS returned
         FROM inventory_transactions
        WHERE reference = ? AND type = 'out' AND item_id = ?`,
      [purchaseNumber, itemId]
    );
    const available = Math.max(0, owned - Number(returned || 0));
    if (qty > available) {
      await conn.rollback();
      return res.status(400).render("error", {
        message: `Jumlah retur (${qty}) melebihi jumlah yang dimiliki. Sisa yang bisa diretur untuk barang ini hanya ${available}.`,
        error: { status: 400, stack: "" },
      });
    }

    // Catat transaksi keluar (retur ke vendor).
    const now = new Date();
    const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
    const notes = detail ? `${reasonLabel} - ${detail}` : reasonLabel;

    await conn.query(
      `INSERT INTO inventory_transactions
         (item_id, type, quantity, transaction_date, reference, notes, created_at, updated_at)
       VALUES (?, 'out', ?, ?, ?, ?, NOW(), NOW())`,
      [itemId, qty, today, purchaseNumber, notes]
    );

    // Pembaruan angka stok (inventories) diserahkan ke modul Stok Opname (B11).

    await conn.commit();
    res.redirect(`/receiving/${poId}/detail`);
  } catch (err) {
    await conn.rollback();
    next(err);
  } finally {
    conn.release();
  }
};

/**
 * POST /receiving/replacement
 * Catat barang ganti (replacement) dari vendor saat tiba -> tambah stok.
 * Reuse inventory_transactions type 'in' dengan referensi No PO yang sama.
 */
const replacement = async (req, res, next) => {
  const poId = req.body.po_id;
  const itemId = req.body.item_id;
  const qty = parseInt(req.body.quantity, 10);
  const detail = (req.body.notes || "").trim();

  if (!poId || !itemId || !Number.isInteger(qty) || qty <= 0) {
    return res.status(400).render("error", {
      message: "Data barang ganti tidak valid (item & jumlah wajib diisi).",
      error: { status: 400, stack: "" },
    });
  }

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const [poRows] = await conn.query(
      "SELECT purchase_number, status FROM inventory_purchases WHERE id = ?",
      [poId]
    );
    if (poRows.length === 0) {
      await conn.rollback();
      return res.status(404).render("error", {
        message: "Purchase order tidak ditemukan.",
        error: { status: 404, stack: "" },
      });
    }
    // Penerimaan yang sudah final (completed) terkunci: tidak bisa catat ganti lagi.
    if (poRows[0].status === "completed") {
      await conn.rollback();
      return res.status(409).render("error", {
        message: "Penerimaan sudah final (Selesai); barang ganti tidak dapat dicatat lagi.",
        error: { status: 409, stack: "" },
      });
    }
    const purchaseNumber = poRows[0].purchase_number;

    const now = new Date();
    const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
    // Awalan "Barang ganti" dipakai untuk membedakan dari transaksi konfirmasi.
    const notes = detail ? `Barang ganti - ${detail}` : "Barang ganti dari vendor";

    await conn.query(
      `INSERT INTO inventory_transactions
         (item_id, type, quantity, transaction_date, reference, notes, created_at, updated_at)
       VALUES (?, 'in', ?, ?, ?, ?, NOW(), NOW())`,
      [itemId, qty, today, purchaseNumber, notes]
    );

    // Pembaruan angka stok (inventories) diserahkan ke modul Stok Opname (B11).

    await conn.commit();
    res.redirect(`/receiving/${poId}/detail`);
  } catch (err) {
    await conn.rollback();
    next(err);
  } finally {
    conn.release();
  }
};

/**
 * GET /receiving/:id/detail
 * Detail penerimaan: PO + qty dipesan vs qty diterima.
 */
const detail = async (req, res, next) => {
  try {
    const id = req.params.id;

    const [poRows] = await pool.query(
      `SELECT id, purchase_number, supplier, purchase_date, status
       FROM inventory_purchases WHERE id = ?`,
      [id]
    );
    const po = poRows[0]
      ? {
          ...poRows[0],
          purchase_date: fmtDate(poRows[0].purchase_date),
          status_label: STATUS_LABEL[poRows[0].status] || poRows[0].status,
        }
      : null;

    // Qty diterima dihitung dari transaksi masuk (type='in') yang mereferensikan No PO.
    const [items] = await pool.query(
      `SELECT ipi.id, it.id AS item_id, it.name, it.unit,
              ipi.quantity AS ordered_qty,
              ipi.price,
              ipi.received_quantity AS verified_good,
              ipi.received_defective AS verified_defective,
              ipi.received_note,
              COALESCE(SUM(CASE WHEN t.type = 'in' THEN t.quantity END), 0) AS received_qty
       FROM inventory_purchase_items ipi
       JOIN items it ON it.id = ipi.item_id
       JOIN inventory_purchases p ON p.id = ipi.inventory_purchase_id
       LEFT JOIN inventory_transactions t
              ON t.item_id = ipi.item_id
             AND t.reference = p.purchase_number
             AND t.type = 'in'
       WHERE ipi.inventory_purchase_id = ?
       GROUP BY ipi.id, it.id, it.name, it.unit, ipi.quantity, ipi.price,
                ipi.received_quantity, ipi.received_defective, ipi.received_note
       ORDER BY ipi.id`,
      [id]
    );

    // Jumlah barang ganti per item (untuk mengoreksi tampilan cacat -> baik).
    const replacedByItem = {};
    if (po) {
      const [repRows] = await pool.query(
        `SELECT item_id, COALESCE(SUM(quantity), 0) AS replaced
           FROM inventory_transactions
          WHERE reference = ? AND type = 'in' AND notes LIKE 'Barang ganti%'
          GROUP BY item_id`,
        [po.purchase_number]
      );
      repRows.forEach((r) => { replacedByItem[r.item_id] = Number(r.replaced) || 0; });
    }

    // Jumlah yang SUDAH diretur per item (transaksi keluar 'out' referensi No PO ini).
    // Dipakai untuk menghitung sisa yang masih boleh diretur (available_return).
    const returnedByItem = {};
    if (po) {
      const [retRows] = await pool.query(
        `SELECT item_id, COALESCE(SUM(quantity), 0) AS returned
           FROM inventory_transactions
          WHERE reference = ? AND type = 'out'
          GROUP BY item_id`,
        [po.purchase_number]
      );
      retRows.forEach((r) => { returnedByItem[r.item_id] = Number(r.returned) || 0; });
    }

    let totalOrdered = 0;
    let totalGood = 0;
    let totalDefective = 0;
    let totalValue = 0;
    items.forEach((i) => {
      i.ordered_qty = Number(i.ordered_qty);
      i.received_qty = Number(i.received_qty);
      i.price = Number(i.price) || 0;

      // Hasil verifikasi (bisa null bila item belum diverifikasi).
      i.verified_good = i.verified_good == null ? null : Number(i.verified_good);
      i.verified_defective = i.verified_defective == null ? null : Number(i.verified_defective);
      i.is_verified = i.verified_good != null || i.verified_defective != null;

      // Koreksi barang ganti: unit cacat yang sudah diganti vendor dianggap beres,
      // dipindah dari "Cacat" ke "Baik" (maksimal sebanyak jumlah cacat). Dengan
      // begitu, bila semua cacat sudah diganti -> Cacat 0 & Baik penuh.
      const goodRaw = i.verified_good || 0;
      const defectiveRaw = i.verified_defective || 0;
      const applied = Math.min(replacedByItem[i.item_id] || 0, defectiveRaw);
      const good = goodRaw + applied;
      const defective = defectiveRaw - applied;
      if (i.is_verified) {
        i.verified_good = good;
        i.verified_defective = defective;
      }

      i.total_received = good + defective; // total fisik yang datang
      i.diff = i.is_verified ? i.total_received - i.ordered_qty : null;

      // Sisa yang masih boleh diretur = total dimiliki − yang sudah diretur.
      // Bila belum diverifikasi, pakai jumlah dipesan sebagai acuan sementara.
      const ownedQty = i.is_verified ? i.total_received : i.ordered_qty;
      i.available_return = Math.max(0, ownedQty - (returnedByItem[i.item_id] || 0));

      i.line_total = i.price * i.ordered_qty;
      i.price_label = fmtRp(i.price);
      i.line_total_label = fmtRp(i.line_total);

      totalOrdered += i.ordered_qty;
      totalGood += good;
      totalDefective += defective;
      totalValue += i.line_total;
    });

    const summary = {
      itemCount: items.length,
      totalOrdered,
      totalGood,
      totalDefective,
      totalValue,
      totalValue_label: fmtRp(totalValue),
    };

    // Riwayat retur (transaksi keluar 'out' yang mereferensikan No PO ini).
    let returns = [];
    if (po) {
      const [rows] = await pool.query(
        `SELECT t.quantity, t.transaction_date, t.notes, it.name, it.unit
         FROM inventory_transactions t
         JOIN items it ON it.id = t.item_id
         WHERE t.reference = ? AND t.type = 'out'
         ORDER BY t.id DESC`,
        [po.purchase_number]
      );
      returns = rows.map((r) => ({
        ...r,
        transaction_date: fmtDate(r.transaction_date),
      }));
    }

    // Riwayat barang ganti (transaksi 'in' bertanda "Barang ganti", referensi No PO ini).
    let replacements = [];
    if (po) {
      const [rows] = await pool.query(
        `SELECT t.quantity, t.transaction_date, t.notes, it.name, it.unit
         FROM inventory_transactions t
         JOIN items it ON it.id = t.item_id
         WHERE t.reference = ? AND t.type = 'in' AND t.notes LIKE 'Barang ganti%'
         ORDER BY t.id DESC`,
        [po.purchase_number]
      );
      replacements = rows.map((r) => ({
        ...r,
        transaction_date: fmtDate(r.transaction_date),
      }));
    }

    // Bukti penerimaan yang diunggah saat verifikasi.
    const [attRows] = await pool.query(
      `SELECT id, file_path, original_name, mime_type, created_at
         FROM inventory_receiving_attachments
        WHERE inventory_purchase_id = ?
        ORDER BY id DESC`,
      [id]
    );
    const attachments = attRows.map((a) => ({
      ...a,
      url: `/assets/uploads/receiving/${a.file_path}`,
      is_pdf: a.mime_type === "application/pdf",
      created_label: fmtDate(a.created_at),
    }));

    res.render("receiving/detail", {
      title: "Detail Penerimaan",
      user: req.session.username,
      po,
      items,
      summary,
      returns,
      replacements,
      attachments,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /receiving/:id/export
 * Generate Laporan Penerimaan Barang (PDF) dengan pdfkit.
 */
const exportPDF = async (req, res, next) => {
  try {
    const id = req.params.id;

    const [poRows] = await pool.query(
      `SELECT id, purchase_number, supplier, purchase_date, status
       FROM inventory_purchases WHERE id = ?`,
      [id]
    );
    if (poRows.length === 0) {
      return res.status(404).render("error", {
        message: "Purchase order tidak ditemukan.",
        error: { status: 404, stack: "" },
      });
    }
    const po = poRows[0];

    // "Diterima" pada laporan = barang yang diterima saat PENERIMAAN AWAL
    // (baik + cacat dari verifikasi), BUKAN penjumlahan semua transaksi masuk
    // (barang ganti yang datang belakangan tidak ikut dihitung di sini).
    const [items] = await pool.query(
      `SELECT it.name, it.unit,
              ipi.quantity AS ordered_qty,
              ipi.price,
              ipi.received_quantity,
              ipi.received_defective
       FROM inventory_purchase_items ipi
       JOIN items it ON it.id = ipi.item_id
       WHERE ipi.inventory_purchase_id = ?
       ORDER BY ipi.id`,
      [id]
    );

    const doc = new PDFDocument({ size: "A4", margin: 50 });
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="Laporan-Penerimaan-${po.purchase_number}.pdf"`
    );
    doc.pipe(res);

    // Judul
    doc.font("Helvetica-Bold").fontSize(16).text("Laporan Penerimaan Barang", { align: "center" });
    doc.font("Helvetica").fontSize(10).fillColor("#666")
      .text("FacultyWare - Sistem Informasi Pengadaan Barang Fakultas", { align: "center" });
    doc.fillColor("#000").moveDown(1.2);

    // Info PO
    const infoY = doc.y;
    doc.fontSize(10).font("Helvetica-Bold").text("No PO", 50, infoY);
    doc.font("Helvetica").text(`: ${po.purchase_number}`, 140, infoY);
    doc.font("Helvetica-Bold").text("Pemasok", 50, infoY + 16);
    doc.font("Helvetica").text(`: ${po.supplier || "-"}`, 140, infoY + 16);
    doc.font("Helvetica-Bold").text("Tanggal", 50, infoY + 32);
    doc.font("Helvetica").text(`: ${fmtDate(po.purchase_date)}`, 140, infoY + 32);
    doc.font("Helvetica-Bold").text("Status", 50, infoY + 48);
    doc.font("Helvetica").text(`: ${STATUS_LABEL[po.status] || po.status}`, 140, infoY + 48);
    doc.moveDown(4);

    // Tabel
    const colX = { no: 50, name: 80, ordered: 285, received: 350, price: 415, subtotal: 490 };
    const drawRow = (y, c, opts = {}) => {
      doc.font(opts.bold ? "Helvetica-Bold" : "Helvetica").fontSize(9);
      doc.text(c.no, colX.no, y, { width: 25 });
      doc.text(c.name, colX.name, y, { width: 200 });
      doc.text(c.ordered, colX.ordered, y, { width: 55, align: "right" });
      doc.text(c.received, colX.received, y, { width: 55, align: "right" });
      doc.text(c.price, colX.price, y, { width: 65, align: "right" });
      doc.text(c.subtotal, colX.subtotal, y, { width: 65, align: "right" });
    };

    let y = doc.y;
    drawRow(y, { no: "No", name: "Nama Barang", ordered: "Dipesan", received: "Diterima", price: "Harga", subtotal: "Subtotal" }, { bold: true });
    y += 14;
    doc.moveTo(50, y).lineTo(555, y).strokeColor("#cccccc").stroke();
    y += 6;

    let totalValue = 0;
    items.forEach((it, idx) => {
      const ordered = Number(it.ordered_qty);
      // Diterima awal = baik + cacat (hasil verifikasi). Bila belum diverifikasi,
      // anggap diterima penuh sesuai jumlah dipesan.
      const verified = it.received_quantity != null || it.received_defective != null;
      const received = verified
        ? Number(it.received_quantity || 0) + Number(it.received_defective || 0)
        : ordered;
      const price = Number(it.price) || 0;
      const subtotal = price * ordered;
      totalValue += subtotal;

      if (y > 760) {
        doc.addPage();
        y = 50;
      }
      drawRow(y, {
        no: String(idx + 1),
        name: `${it.name} (${it.unit})`,
        ordered: String(ordered),
        received: String(received),
        price: fmtRp(price),
        subtotal: fmtRp(subtotal),
      });
      y += 16;
    });

    y += 4;
    doc.moveTo(50, y).lineTo(555, y).strokeColor("#cccccc").stroke();
    y += 8;
    doc.font("Helvetica-Bold").fontSize(10);
    doc.text("Total Nilai PO", colX.name, y, { width: 200 });
    doc.text(fmtRp(totalValue), colX.price, y, { width: 130, align: "right" });

    // Tanda tangan / footer
    doc.font("Helvetica").fontSize(9).fillColor("#666")
      .text(`Dicetak: ${fmtDate(new Date())}`, 50, 790, { align: "left" });

    doc.end();
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/receiving
 * REST API list penerimaan barang (JSON) dengan pagination.
 */
const apiList = async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || PAGE_SIZE));
    const offset = (page - 1) * limit;
    const { where, params } = buildSearch(req.query.q);

    const [rows] = await pool.query(
      `SELECT id, purchase_number, supplier, purchase_date, status
       FROM inventory_purchases
       ${where}
       ORDER BY purchase_date DESC, id DESC
       LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );

    const [[{ total }]] = await pool.query(
      `SELECT COUNT(*) AS total FROM inventory_purchases ${where}`,
      params
    );

    const data = rows.map((r) => {
      const d = r.purchase_date ? new Date(r.purchase_date) : null;
      const iso = d
        ? `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`
        : null;
      return { ...r, purchase_date: iso };
    });

    res.json({
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.max(1, Math.ceil(total / limit)),
      },
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  index,
  verifyForm,
  verifyStore,
  confirm,
  retur,
  replacement,
  detail,
  exportPDF,
  apiList,
};
