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
  const [rows] = await db.query(
    `SELECT 1
     FROM permissions p
     JOIN role_has_permissions rhp ON p.id = rhp.permission_id
     JOIN model_has_roles mhr      ON rhp.role_id = mhr.role_id
     WHERE mhr.model_id = ?
       AND mhr.model_type = 'App\\\\Models\\\\User'
       AND p.name = ?
     LIMIT 1`,
    [userId, permissionName]
  );
  return rows.length > 0;
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
  } catch {
    return res.redirect("/equipment-loans");
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
    res.redirect(isManager ? "/manager" : "/equipment-loans");
  } catch (err) {
    next(err);
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