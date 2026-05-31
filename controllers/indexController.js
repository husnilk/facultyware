const bcrypt = require("bcryptjs");
const db = require("../lib/db");

const index = (req, res) => {
  res.render("index", { title: "Express" });
};

const home = (req, res) => {
  res.render("home", { title: "Home", user: req.session.name });
};

// 1. Menampilkan Halaman Login
const loginPage = (req, res) => {
  // JIKA SUDAH LOGIN: Arahkan ke equipment-loans (konsisten)
  if (req.session.userId) {
    return res.redirect("/equipment-loans");
  }
  res.render("login", { title: "Login", error: null });
};

// 2. Memproses Login
const login = async (req, res, next) => {
  // Variabel 'name' ini berisi teks apapun yang diketik user di form input HTML
  const { name, password } = req.body;

  try {
    // FITUR BARU: Cari kecocokan di kolom 'name' ATAU kolom 'email'
    const [rows] = await db.query(
      "SELECT * FROM users WHERE name = ? OR email = ?", 
      [name, name] // Variabel 'name' dimasukkan 2 kali untuk mengisi kedua tanda tanya (?)
    );

    // Jika nama/email tidak ada di database
    if (rows.length === 0) {
      return res.render("login", {
        title: "Login",
        error: "Nama/Email atau password salah!", // Pesan error diperbaiki
      });
    }

    const user = rows[0];
    const isMatch = await bcrypt.compare(password, user.password);

    // Jika password salah
    if (!isMatch) {
      return res.render("login", {
        title: "Login",
        error: "Nama/Email atau password salah!", // Pesan error diperbaiki
      });
    }

    // Set session setelah sukses
    req.session.userId = user.id;
    req.session.name = user.name;

    // JIKA SUKSES LOGIN: Arahkan ke equipment-loans
    res.redirect("/equipment-loans");
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