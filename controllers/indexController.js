const bcrypt = require("bcryptjs");
const db = require("../lib/db");

const index = (req, res) => {
  res.render("home", { title: "Home", user: req.session.username });
};

const loginPage = (req, res) => {
  if (req.session.userId) {
    return res.redirect("/");
  }
  res.render("login", { layout: false, title: "Login", error: null });
};

const login = async (req, res, next) => {
  const { username, password } = req.body;

  try {
    const [rows] = await db.query("SELECT * FROM users WHERE username = ?", [
      username,
    ]);

    if (rows.length === 0) {
      return res.render("login", {
        layout: false,
        title: "Login",
        error: "Invalid username or password",
      });
    }

    const user = rows[0];

    if (user.active === 0) {
      return res.render("login", {
        layout: false,
        title: "Login",
        error: "Your account is deactivated. Please contact administrator.",
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.render("login", {
        layout: false,
        title: "Login",
        error: "Invalid username or password",
      });
    }

    // Set session
    req.session.userId = user.id;
    req.session.username = user.username;

    res.redirect("/");
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

const passwordPage = (req, res) => {
  res.render("password", {
    title: "Change Password",
    user: req.session.username,
    error: null,
    success: null,
  });
};

const changePassword = async (req, res, next) => {
  const { currentPassword, newPassword, confirmPassword } = req.body;

  try {
    if (!currentPassword || !newPassword || !confirmPassword) {
      return res.render("password", {
        title: "Change Password",
        user: req.session.username,
        error: "All fields are required.",
        success: null,
      });
    }

    if (newPassword !== confirmPassword) {
      return res.render("password", {
        title: "Change Password",
        user: req.session.username,
        error: "New password and confirmation do not match.",
        success: null,
      });
    }

    if (newPassword.length < 8) {
      return res.render("password", {
        title: "Change Password",
        user: req.session.username,
        error: "New password must be at least 8 characters long.",
        success: null,
      });
    }

    const [[user]] = await db.query("SELECT id, password FROM users WHERE id = ?", [
      req.session.userId,
    ]);

    if (!user) {
      req.session.destroy(() => {
        res.redirect("/login");
      });
      return;
    }

    const isCurrentPasswordValid = await bcrypt.compare(
      currentPassword,
      user.password,
    );

    if (!isCurrentPasswordValid) {
      return res.render("password", {
        title: "Change Password",
        user: req.session.username,
        error: "Current password is incorrect.",
        success: null,
      });
    }

    const isNewPasswordSameAsCurrent = await bcrypt.compare(
      newPassword,
      user.password,
    );

    if (isNewPasswordSameAsCurrent) {
      return res.render("password", {
        title: "Change Password",
        user: req.session.username,
        error: "New password must be different from current password.",
        success: null,
      });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 12);
    await db.query("UPDATE users SET password = ? WHERE id = ?", [
      hashedPassword,
      user.id,
    ]);

    return res.render("password", {
      title: "Change Password",
      user: req.session.username,
      error: null,
      success: "Password changed successfully.",
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  index,
  loginPage,
  login,
  logout,
  passwordPage,
  changePassword,
};
