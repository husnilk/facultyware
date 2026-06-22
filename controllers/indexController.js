const bcrypt = require("bcryptjs");
const db = require("../lib/db");

const index = (req, res) => {
  res.render("index", { title: "Express" });
};


// Helper: cek apakah user punya permission tertentu
const hasPermission = async (userId, permissionName) => {
  const modelTypes = ['App\\Models\\User', 'App\\User', 'User'];
  const [rows] = await db.query(
    `SELECT 1
     FROM permissions p
     JOIN role_has_permissions rhp ON p.id = rhp.permission_id
     JOIN model_has_roles mhr      ON rhp.role_id = mhr.role_id
     WHERE mhr.model_id = ?
       AND mhr.model_type IN (?)
       AND p.name = ?
     LIMIT 1`,
    [userId, modelTypes, permissionName]
  );

  if (rows.length > 0) {
    return true;
  }

  const [directRows] = await db.query(
    `SELECT 1
     FROM permissions p
     JOIN model_has_permissions mhp ON p.id = mhp.permission_id
     WHERE mhp.model_id = ?
       AND mhp.model_type IN (?)
       AND p.name = ?
     LIMIT 1`,
    [userId, modelTypes, permissionName]
  );

  return directRows.length > 0;
};

// 1. Menampilkan Halaman Login
const loginPage = async (req, res) => {
  if (!req.session.userId) {
    return res.render("login", { title: "Login", error: null });
  }
  // Sudah login — arahkan ke halaman yang sesuai dengan role
  try {
    const isManager = await hasPermission(req.session.userId, "manage-equipment-loans");
    return res.redirect(isManager ? "/manager" : "/equipment-loans");
  } catch (err) {
    console.error("Login session validation error:", err);
    return res.render("login", {
      title: "Login",
      error: "Tidak dapat memvalidasi sesi. Silakan login kembali atau periksa koneksi database."
    });
  }
};

// 2. Memproses Login
const login = async (req, res, next) => {
  const { name, password } = req.body;

  try {
    // Cari user berdasarkan name ATAU email
    const [rows] = await db.query(
      "SELECT * FROM users WHERE name = ? OR email = ?",
      [name, name]
    );

    if (rows.length === 0) {
      return res.render("login", {
        title: "Login",
        error: "Username atau password salah!",
      });
    }

    const user = rows[0];
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.render("login", {
        title: "Login",
        error: "Username atau password salah!",
      });
    }

    // Simpan session
    req.session.userId = user.id;
    req.session.name = user.name;

    // Redirect berdasarkan role
    const isManager = await hasPermission(user.id, "manage-equipment-loans");
    return res.redirect(isManager ? "/manager" : "/equipment-loans");
  } catch (err) {
    console.error("Login error:", err);
    return res.render("login", {
      title: "Login",
      error: err.code === "ECONNREFUSED"
        ? "Tidak dapat terhubung ke database. Silakan cek layanan MySQL."
        : "Terjadi kesalahan saat memproses login. Silakan coba lagi."
    });
  }
};

// 3. Proses Logout
const logout = (req, res, next) => {
  req.session.destroy((err) => {
    if (err) {
      return next(err);
    }
    res.redirect("/login");
  });
};

module.exports = {
  index,
  loginPage,
  login,
  logout
};