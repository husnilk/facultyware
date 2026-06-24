const bcrypt = require('bcryptjs');
const User = require('../models/User');

const loginPage = (req, res) => {
  if (req.session && req.session.userId) {
    if (req.session.role === 'pimpinan') {
      return res.redirect('/pimpinan/dashboard');
    }
    return res.redirect('/pegawai/dashboard');
  }
  res.render('auth/login', { title: 'Login', error: req.query.error || null });
};

const login = async (req, res, next) => {
  const { username, password } = req.body;

  try {
    const user = await User.findByUsernameOrEmail(username);

    if (!user) {
      return res.render('auth/login', {
        title: 'Login',
        error: 'Username/Email atau Password salah.'
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.render('auth/login', {
        title: 'Login',
        error: 'Username/Email atau Password salah.'
      });
    }

    // Set session variables
    req.session.userId = user.id;
    req.session.username = user.username;
    req.session.role = user.role;
    req.session.employeeId = user.employee_id;
    req.session.name = user.name;

    // Redirect based on role
    if (user.role === 'pimpinan') {
      res.redirect('/pimpinan/dashboard');
    } else {
      res.redirect('/pegawai/dashboard');
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
    res.clearCookie('session_cookie_name');
    res.redirect('/login');
  });
};

module.exports = {
  loginPage,
  login,
  logout
};
