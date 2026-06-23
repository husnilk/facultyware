const bcrypt = require("bcryptjs");
const db = require("../lib/db");

const index = (req, res) => {
  return res.redirect("/login");
};

const home = (req, res) => {
  return res.render("home", {
    title: "Home",
    user: req.session?.username || req.session?.name || "User",
    currentUser: req.session?.user || null,
  });
};

const loginPage = (req, res) => {
  if (req.session && req.session.userId) {
    return res.redirect("/home");
  }

  return res.render("login", {
    title: "Login",
    error: null,
    oldInput: "",
  });
};

const login = async (req, res, next) => {
  const identifier = (
    req.body.username ||
    req.body.email ||
    req.body.name ||
    ""
  ).trim();

  const password = req.body.password || "";

  try {
    if (!identifier || !password) {
      return res.status(400).render("login", {
        title: "Login",
        error: "Email/nama dan password wajib diisi",
        oldInput: identifier,
      });
    }

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
      [identifier, identifier]
    );

    if (!rows || rows.length === 0) {
      return res.status(401).render("login", {
        title: "Login",
        error: "Email/nama atau password salah",
        oldInput: identifier,
      });
    }

    const user = rows[0];

    let isPasswordValid = false;

    if (user.password && String(user.password).startsWith("$2")) {
      isPasswordValid = await bcrypt.compare(password, user.password);
    } else {
      isPasswordValid = password === user.password;
    }

    if (!isPasswordValid) {
      return res.status(401).render("login", {
        title: "Login",
        error: "Email/nama atau password salah",
        oldInput: identifier,
      });
    }

    req.session.userId = user.id;
    req.session.user_id = user.id;
    req.session.username = user.name;
    req.session.name = user.name;
    req.session.email = user.email;
    req.session.employeeId = user.employee_id || null;
    req.session.employee_id = user.employee_id || null;

    req.session.user = {
      id: user.id,
      userId: user.id,
      user_id: user.id,
      name: user.name,
      username: user.name,
      email: user.email,
      employeeId: user.employee_id || null,
      employee_id: user.employee_id || null,
      role: "admin",
      permissions: [
        "manage_events",
        "manage_users",
        "manage_committee",
        "manage_certificates",
        "manage_reports",
        "manage_attendance",
      ],
    };

    return req.session.save((err) => {
      if (err) {
        return next(err);
      }

      return res.redirect("/home");
    });
  } catch (err) {
    return next(err);
  }
};

const logout = (req, res, next) => {
  if (!req.session) {
    return res.redirect("/login");
  }

  req.session.destroy((err) => {
    if (err) {
      return next(err);
    }

    return res.redirect("/login");
  });
};

module.exports = {
  index,
  home,
  loginPage,
  login,
  logout,
};