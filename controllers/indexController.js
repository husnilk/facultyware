const bcrypt = require("bcryptjs");
const db = require("../lib/db");

/**
 * Halaman awal
 */
const index = (req, res) => {
  if (req.session.userId) {
    return res.redirect("/home");
  }

  res.redirect("/login");
};

/**
 * Halaman home setelah login
 */
const home = (req, res) => {
  res.render("home", {
    title: "Home",
    user: req.session.name,
  });
};

/**
 * Menampilkan halaman login
 */
const loginPage = (req, res) => {
  if (req.session.userId) {
    return res.redirect("/home");
  }

  res.render("login", {
    title: "Login",
    error: null,
  });
};

/**
 * Proses login menggunakan email
 */
const login = async (req, res, next) => {
  const { email, password } = req.body;

  try {
    // Cari user berdasarkan email
   const [rows] = await db.query(
  "SELECT * FROM users WHERE email = ?",
  [email]
);

console.log("Email input:", email);
console.log("Data user:", rows);

    // Jika email tidak ditemukan
    if (rows.length === 0) {
      return res.render("login", {
        title: "Login",
        error: "Email atau password salah",
      });
    }

    const user = rows[0];

    // Cek password bcrypt
    const isMatch = await bcrypt.compare(
      password,
      user.password
    );

    // Jika password salah
    if (!isMatch) {
      return res.render("login", {
        title: "Login",
        error: "Email atau password salah",
      });
    }

    // Simpan data ke session
    req.session.userId = user.id;
    req.session.name = user.name;
    req.session.email = user.email;

    // Redirect ke halaman home
    res.redirect("/home");

  } catch (error) {
    next(error);
  }
};

/**
 * Logout
 */
const logout = (req, res, next) => {
  req.session.destroy((error) => {
    if (error) {
      return next(error);
    }

    res.redirect("/login");
  });
};

module.exports = {
  index,
  home,
  loginPage,
  login,
  logout,
};