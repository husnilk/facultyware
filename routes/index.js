const express = require('express');
const router = express.Router();
const { isAuthenticated } = require('../middlewares/auth');

// GET / -> redirect to login or dashboard
router.get('/', (req, res) => {
  if (req.session && req.session.userId) {
    return res.redirect('/home');
  }
  res.redirect('/login');
});

// GET /home -> redirect based on role
router.get('/home', isAuthenticated, (req, res) => {
  if (req.session.role === 'pimpinan') {
    return res.redirect('/pimpinan/dashboard');
  }
  res.redirect('/pegawai/dashboard');
});

module.exports = router;
