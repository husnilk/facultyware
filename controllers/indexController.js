const bcrypt = require("bcryptjs");
const db = require("../lib/db");

const index = (req, res) => {
  res.redirect("/login");
};

const home = async (req, res, next) => {
  try {
    // Statistik total
    const [[{ total }]] = await db.query(`SELECT COUNT(*) AS total FROM assets WHERE type = 'equipment'`);

    // Kondisi
    const [[{ good }]] = await db.query(`SELECT COUNT(*) AS good FROM assets WHERE type = 'equipment' AND \`condition\` = 'good'`);
    const [[{ damaged }]] = await db.query(`SELECT COUNT(*) AS damaged FROM assets WHERE type = 'equipment' AND \`condition\` IN ('minor_damage', 'major_damage')`);

    // Status
    const [[{ available }]] = await db.query(`SELECT COUNT(*) AS available FROM assets WHERE type = 'equipment' AND status = 'available'`);
    const [[{ in_use }]] = await db.query(`SELECT COUNT(*) AS in_use FROM assets WHERE type = 'equipment' AND status = 'in_use'`);
    const [[{ maintenance }]] = await db.query(`SELECT COUNT(*) AS maintenance FROM assets WHERE type = 'equipment' AND status = 'maintenance'`);
    const [[{ retired }]] = await db.query(`SELECT COUNT(*) AS retired FROM assets WHERE type = 'equipment' AND status = 'retired'`);

    // 5 aset terbaru
    const [recentEquipments] = await db.query(`
      SELECT a.id, a.name, a.code, a.condition, a.status, a.created_at,
        e.brand, e.model
      FROM assets a
      JOIN equipments e ON e.asset_id = a.id
      WHERE a.type = 'equipment'
      ORDER BY a.created_at DESC
      LIMIT 5
    `);

    res.render('home', {
      title: 'Dashboard',
      user: req.session.email,
      stats: { total, good, damaged, available, in_use, maintenance, retired },
      recentEquipments,
    });
  } catch (err) {
    next(err);
  }
};

const loginPage = (req, res) => {
  if (req.session.userId) {
    return res.redirect("/home");
  }
  res.render("login", { title: "Login", error: null });
};

const login = async (req, res, next) => {
  const { email, password } = req.body;

  try {
    const [rows] = await db.query("SELECT * FROM users WHERE email = ?", [
      email,
    ]);

    if (rows.length === 0) {
      return res.render("login", {
        title: "Login",
        error: "Email atau password salah",
      });
    }

    const user = rows[0];
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.render("login", {
        title: "Login",
        error: "Email atau password salah",
      });
    }

    // Set session
    req.session.userId = user.id;
    req.session.email = user.email;
    req.session.name = user.name;

    // res.redirect sudah dibungkus middleware agar menyimpan sesi dulu
    // (lihat app.js) — mencegah race condition dengan store async.
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
