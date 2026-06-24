const index = (req, res) => {
  res.render("index", { title: "Express" });
};

// ========================================================
// REVISI 1: FUNGSI HOME BAWA DATA STATISTIK UNTUK ADMIN
// ========================================================
const home = async (req, res, next) => {
  try {
    const user = req.session.user; // Ambil object user dari session

    // Kalau yang login adalah Penanggung Jawab
    if (user && user.role === 'penanggung_jawab') {
      // 1. Query untuk Bar Chart (Ruangan Terfavorit)
      const chartQuery = `
          SELECT r.name, COUNT(rl.id) as total_pinjam
          FROM room_loans rl
          JOIN rooms r ON rl.room_id = r.id
          GROUP BY r.id
          ORDER BY total_pinjam DESC
          LIMIT 5
      `;
      const [popularRooms] = await db.query(chartQuery);

      // Render halaman dashboard admin dan kirim datanya biar EJS nggak error
      return res.render("dashboard-admin", {
        title: "Dashboard Penanggung Jawab",
        user: user,
        stats: {},              // Data dummy sementara
        popularRooms: popularRooms,
        monthlyTrends: []       // Data dummy sementara
      });
    }

    // Kalau yang login adalah user/mahasiswa biasa
    res.render("home", { title: "Home", user: user });

  } catch (err) {
    next(err);
  }
};

const loginPage = (req, res) => {
  // Ubah pengecekan sesuai struktur session yang baru
  if (req.session.user) {
    return res.redirect("/home");
  }
  res.render("login", { title: "Login", error: null });
};

// ========================================================
// REVISI 2: FUNGSI LOGIN MENYIMPAN ROLE & OBJECT USER
// ========================================================
const login = async (req, res, next) => {
  const { username, password } = req.body;

  try {
    const [rows] = await db.query("SELECT * FROM users WHERE username = ?", [
      username,
    ]);

    if (rows.length === 0) {
      return res.render("login", {
        title: "Login",
        error: "Invalid username or password",
      });
    }

    const user = rows[0];
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.render("login", {
        title: "Login",
        error: "Invalid username or password",
      });
    }

    // SET SESSION BARU: Format ini nyambung ke bookingController.js
    req.session.user = {
      id: user.id,
      username: user.username,
      role: user.role || 'pengguna'
    };

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
  logout
};