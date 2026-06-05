const bcrypt = require("bcryptjs");
const db = require("../lib/db");

const index = (req, res) => {
  res.render("index", { title: "Express" });
};

const home = (req, res) => {
  res.render("home", { title: "Home", user: req.session.name });
};

// Helper: cek apakah user punya permission tertentu
const hasPermission = async (userId, permissionName) => {
  const modelTypes = ['App\\Models\\User', 'App\\User'];
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

const isManagerFallback = async (user) => {
  const [permRows] = await db.query('SELECT COUNT(*) AS total FROM permissions');
  const [roleRows] = await db.query('SELECT COUNT(*) AS total FROM role_has_permissions');
  const [modelRoleRows] = await db.query('SELECT COUNT(*) AS total FROM model_has_roles');
  const [modelPermRows] = await db.query('SELECT COUNT(*) AS total FROM model_has_permissions');

  const hasPermissionData = permRows[0].total > 0 || roleRows[0].total > 0 || modelRoleRows[0].total > 0 || modelPermRows[0].total > 0;
  if (!hasPermissionData) {
    if (process.env.MANAGER_USER_IDS) {
      const allowedIds = process.env.MANAGER_USER_IDS.split(',').map((id) => id.trim()).filter(Boolean).map(Number);
      if (allowedIds.includes(user.id)) {
        return true;
      }
    }
    if (process.env.MANAGER_USERS) {
      const allowedUsers = process.env.MANAGER_USERS.split(',').map((value) => value.trim().toLowerCase()).filter(Boolean);
      if (allowedUsers.includes(user.name.toLowerCase()) || allowedUsers.includes(user.email.toLowerCase())) {
        return true;
      }
    }
    return user.id === 1 || user.name.toLowerCase() === 'admin' || user.email.toLowerCase() === 'admin@fakultas.ac.id';
  }

  return false;
};

// 1. Menampilkan Halaman Login
const loginPage = async (req, res) => {
  if (!req.session.userId) {
    return res.render("login", { title: "Login", error: null });
  }
  // Sudah login — arahkan ke halaman yang sesuai dengan role
  try {
    const isManager = await hasPermission(req.session.userId, "manage-equipment-loans");
    if (isManager) {
      return res.redirect("/manager");
    }

    const [rows] = await db.query('SELECT * FROM users WHERE id = ?', [req.session.userId]);
    const user = rows[0];
    const fallbackManager = await isManagerFallback(user);
    return res.redirect(fallbackManager ? "/manager" : "/equipment-loans");
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
        error: "Nama/Email atau password salah!",
      });
    }

    const user = rows[0];
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.render("login", {
        title: "Login",
        error: "Nama/Email atau password salah!",
      });
    }

    // Simpan session
    req.session.userId = user.id;
    req.session.name = user.name;

    // Redirect berdasarkan role
    const isManager = await hasPermission(user.id, "manage-equipment-loans");
    if (isManager) {
      return res.redirect("/manager");
    }

    const fallbackManager = await isManagerFallback(user);
    return res.redirect(fallbackManager ? "/manager" : "/equipment-loans");
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
  home,
  loginPage,
  login,
  logout
};