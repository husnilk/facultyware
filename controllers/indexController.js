const bcrypt = require("bcryptjs");
const db = require("../lib/db");

const index = (req, res) => {
  res.render("index", { title: "Express" });
};

const home = (req, res) => {
  res.render("home", {
    title: "Home",
    user: req.session.username,
  });
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
  const { username, password } = req.body;

  try {
    if (!username || !password) {
      return res.render("login", {
        title: "Login",
        error: "Email/nama dan password wajib diisi",
      });
    }

    /*
      DB dosen:
      users tidak memiliki kolom username.
      Kolom yang tersedia: id, name, email, password, dll.
      Jadi input form bernama username tetap boleh,
      tetapi query ke database memakai email atau name.
    */
    const [rows] = await db.query(
      `
      SELECT
        u.id,
        u.name,
        u.email,
        u.password,
        e.id AS employee_id,
        e.status AS employee_status
      FROM users u
      LEFT JOIN employees e ON e.id = u.id
      WHERE u.email = ? OR u.name = ?
      LIMIT 1
      `,
      [username, username]
    );

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

    req.session.userId = user.id;
    req.session.username = user.name;
    req.session.email = user.email;
    req.session.employeeId = user.employee_id || null;

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