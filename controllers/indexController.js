const bcrypt = require("bcryptjs");
const db = require("../lib/db");

const index = (req, res) => {
  res.redirect("/login");
};

const home = (req, res) => {
  res.render("home", {
    title: "Home",
    user: req.session.userName,
    role: req.session.userRole,
    body: `
      <div class="flex flex-col gap-4">
        <h1 class="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p class="text-muted-foreground">Selamat datang, ${req.session.userName}</p>
      </div>
    `
  });
};

const loginPage = (req, res) => {
  if (req.session.userId) {
    return res.redirect("/home");
  }
  res.render("login", { title: "Login", error: null });
};

const login = async (req, res, next) => {
  const { username, password } = req.body;

  try {
    const [rows] = await db.query(
      "SELECT * FROM users WHERE email = ?",
      [username]
    );

    if (rows.length === 0) {
      return res.render("login", {
        title: "Login",
        error: "Username atau password salah",
      });
    }

    const user = rows[0];
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.render("login", {
        title: "Login",
        error: "Username atau password salah",
      });
    }

    const [roleRows] = await db.query(`
      SELECT r.name
      FROM roles r
      JOIN model_has_roles mhr ON r.id = mhr.role_id
      WHERE mhr.model_id = ?
        AND mhr.model_type = 'App\\\\Models\\\\User'
      LIMIT 1
    `, [user.id]);

    const userRole = roleRows.length > 0 ? roleRows[0].name : null;

    req.session.userId = user.id;
    req.session.userName = user.name;
    req.session.userEmail = user.email;
    req.session.userRole = userRole;

    if (userRole === 'admin') {
      return res.redirect("/admin/survey/rekap");
    } else {
      return res.redirect("/survey");
    }

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