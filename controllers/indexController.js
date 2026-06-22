const bcrypt = require("bcryptjs");
const db = require("../lib/db");
const { getAdminSummary, getUserRoles } = require("../lib/dashboardModel");

const index = (req, res) => {
  res.render("index", { title: "Express" });
};

const home = async (req, res, next) => {
  if (!req.session.userId) {
    return res.redirect("/login");
  }

  try {
    const roles = await getUserRoles(req.session.userId);

    // --- ACL: menu yang muncul mengikuti role yang login ---
    const menus = [];

    if (roles.includes("admin")) {
      menus.push(
        {
          title: "Daftar Peserta Event",
          desc: "Lihat & verifikasi status pendaftaran peserta",
          href: "/participants",
          icon: "👥",
        },
        {
          title: "Sertifikat Peserta",
          desc: "Terbitkan sertifikat untuk peserta yang sudah hadir",
          href: "/certificates",
          icon: "🎓",
        },
        {
          title: "Laporan Kegiatan",
          desc: "Lihat & upload laporan kegiatan event",
          href: "/reports",
          icon: "📄",
        }
      );
    }

    // TODO: tambah menu role lain (panitia/user) kalau sudah digabung repo teman sekelompok
    // if (roles.includes("panitia")) { menus.push(...) }
    // if (roles.includes("user"))    { menus.push(...) }

    let summary = null;
    if (roles.includes("admin")) {
      summary = await getAdminSummary();
    }

    res.render("home", {
      title: "Home",
      user: req.session.username,
      roles,
      menus,
      summary,
    });
  } catch (err) {
    // --- error handling informatif (poin 2b ketentuan dosen) ---
    console.error("Gagal memuat halaman home:", err);
    res.status(500).render("error", {
      message:
        "Terjadi kesalahan saat memuat dashboard. Silakan coba lagi beberapa saat.",
      error: { status: 500, stack: "" },
    });
  }
};

const loginPage = (req, res) => {
  if (req.session.userId) {
    return res.redirect("/home");
  }

  res.render("login", {
    title: "Login",
    error: null,
  });
};

const login = async (req, res, next) => {
  const { email, password } = req.body;

  try {
    const [rows] = await db.query(
      "SELECT * FROM users WHERE email = ?",
      [email]
    );

    if (rows.length === 0) {
      return res.render("login", {
        title: "Login",
        error: "Invalid email or password",
      });
    }

    const user = rows[0];

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.render("login", {
        title: "Login",
        error: "Invalid email or password",
      });
    }

    req.session.userId = user.id;
    req.session.username = user.name;

    res.redirect("/home");
  } catch (err) {
    next(err);
  }
};

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
  logout,
};