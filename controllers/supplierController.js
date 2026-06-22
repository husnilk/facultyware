const Supplier = require("../models/supplier");
const { resolveSort, toSelectOptions } = require("../lib/sort");

// Opsi urutan daftar supplier (whitelist aman untuk ORDER BY).
const SUPPLIER_SORTS = {
  nama:      { label: "Nama (A-Z)", orderBy: "name ASC" },
  nama_desc: { label: "Nama (Z-A)", orderBy: "name DESC" },
  kode:      { label: "Kode (A-Z)", orderBy: "code ASC" },
  terbaru:   { label: "Terbaru",    orderBy: "id DESC" },
};

/**
 * GET /supplier
 * Menampilkan daftar supplier dengan filter pencarian dan paginasi.
 */
exports.index = async (req, res, next) => {
  try {
    const search = (req.query.search || "").trim();
    const page = parseInt(req.query.page, 10) || 1;
    const limit = 10;
    const offset = (page - 1) * limit;
    const sort = resolveSort(req.query.sort, SUPPLIER_SORTS, "nama");

    // Ambil data dengan filter + urutan
    const allSuppliers = await Supplier.findAll(search, sort.orderBy);

    // Manual pagination (simpel dan aman)
    const totalItems = allSuppliers.length;
    const totalPages = Math.ceil(totalItems / limit) || 1;
    const paginatedSuppliers = allSuppliers.slice(offset, offset + limit);

    res.render("supplier/index", {
      title: "Daftar Supplier",
      user: req.session.username,
      suppliers: paginatedSuppliers,
      search,
      currentPage: page,
      totalPages,
      limit,
      sort: sort.key,
      sortOptions: toSelectOptions(SUPPLIER_SORTS),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /supplier/api/list
 * RestAPI: daftar supplier dalam format JSON (pencarian + pagination).
 * Dilindungi permission 'manage_vendor' (lihat routes/supplier.js).
 */
exports.apiList = async (req, res) => {
  try {
    const search = (req.query.search || "").trim();
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = 10;
    const offset = (page - 1) * limit;
    const sort = resolveSort(req.query.sort, SUPPLIER_SORTS, "nama");

    const all = await Supplier.findAll(search, sort.orderBy);
    const total = all.length;
    const data = all.slice(offset, offset + limit);

    res.json({
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.max(1, Math.ceil(total / limit)),
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Gagal mengambil data supplier." });
  }
};

/**
 * GET /supplier/create
 * Menampilkan form tambah supplier baru.
 */
exports.create = async (req, res, next) => {
  try {
    res.render("supplier/create", {
      title: "Tambah Supplier",
      user: req.session.username,
      error: null,
      supplier: {},
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /supplier/create
 * Menyimpan data supplier baru ke database.
 */
exports.store = async (req, res, next) => {
  const { name, code, email, phone, address } = req.body;

  // Validasi dasar
  if (!name || name.trim() === "") {
    return res.render("supplier/create", {
      title: "Tambah Supplier",
      user: req.session.username,
      error: "Nama supplier wajib diisi.",
      supplier: req.body,
    });
  }

  if (!code || code.trim() === "") {
    return res.render("supplier/create", {
      title: "Tambah Supplier",
      user: req.session.username,
      error: "Kode supplier wajib diisi.",
      supplier: req.body,
    });
  }

  try {
    // Validasi keunikan kode
    const codeExists = await Supplier.codeExists(code.trim());
    if (codeExists) {
      return res.render("supplier/create", {
        title: "Tambah Supplier",
        user: req.session.username,
        error: `Kode supplier "${code}" sudah digunakan.`,
        supplier: req.body,
      });
    }

    await Supplier.create({
      name: name.trim(),
      code: code.trim(),
      email: email ? email.trim() : null,
      phone: phone ? phone.trim() : null,
      address: address ? address.trim() : null,
    });

    res.redirect("/supplier");
  } catch (error) {
    next(error);
  }
};

/**
 * GET /supplier/:id/edit
 * Menampilkan form edit supplier.
 */
exports.edit = async (req, res, next) => {
  const { id } = req.params;

  try {
    const supplier = await Supplier.findById(id);
    if (!supplier) {
      return res.status(404).render("error", {
        message: "Data supplier tidak ditemukan.",
        error: { status: 404, stack: "" },
      });
    }

    res.render("supplier/edit", {
      title: "Edit Supplier",
      user: req.session.username,
      error: null,
      supplier,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /supplier/:id/edit
 * Memperbarui data supplier yang sudah ada.
 */
exports.update = async (req, res, next) => {
  const { id } = req.params;
  const { name, code, email, phone, address } = req.body;

  // Validasi dasar
  if (!name || name.trim() === "") {
    return res.render("supplier/edit", {
      title: "Edit Supplier",
      user: req.session.username,
      error: "Nama supplier wajib diisi.",
      supplier: { id, name, code, email, phone, address },
    });
  }

  if (!code || code.trim() === "") {
    return res.render("supplier/edit", {
      title: "Edit Supplier",
      user: req.session.username,
      error: "Kode supplier wajib diisi.",
      supplier: { id, name, code, email, phone, address },
    });
  }

  try {
    const supplier = await Supplier.findById(id);
    if (!supplier) {
      return res.status(404).render("error", {
        message: "Data supplier tidak ditemukan.",
        error: { status: 404, stack: "" },
      });
    }

    // Validasi keunikan kode
    const codeExists = await Supplier.codeExists(code.trim(), id);
    if (codeExists) {
      return res.render("supplier/edit", {
        title: "Edit Supplier",
        user: req.session.username,
        error: `Kode supplier "${code}" sudah digunakan oleh supplier lain.`,
        supplier: { id, name, code, email, phone, address },
      });
    }

    await Supplier.update(id, {
      name: name.trim(),
      code: code.trim(),
      email: email ? email.trim() : null,
      phone: phone ? phone.trim() : null,
      address: address ? address.trim() : null,
    });

    res.redirect("/supplier");
  } catch (error) {
    next(error);
  }
};

/**
 * POST /supplier/:id/delete
 * Menghapus data supplier. Mendukung AJAX JSON response maupun standard Form Post redirect.
 */
exports.destroy = async (req, res, next) => {
  const { id } = req.params;
  const isAjax = req.xhr || (req.headers.accept && req.headers.accept.includes("application/json"));

  try {
    const supplier = await Supplier.findById(id);
    if (!supplier) {
      if (isAjax) {
        return res.status(404).json({ success: false, message: "Data tidak ditemukan." });
      }
      return res.redirect("/supplier");
    }

    // Cek relasi ke PO
    const referenced = await Supplier.isReferenced(id);
    if (referenced) {
      const msg = "Supplier tidak dapat dihapus karena sudah memiliki kaitan dengan transaksi Purchase Order.";
      if (isAjax) {
        return res.status(400).json({ success: false, message: msg });
      }
      return res.status(400).render("error", {
        message: msg,
        error: { status: 400, stack: "" },
      });
    }

    await Supplier.delete(id);

    if (isAjax) {
      return res.json({ success: true, message: "Berhasil menghapus supplier." });
    }
    res.redirect("/supplier");
  } catch (error) {
    if (isAjax) {
      return res.status(500).json({ success: false, message: "Terjadi kesalahan internal database." });
    }
    next(error);
  }
};
