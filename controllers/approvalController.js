const db = require('../lib/db');

// GET /approval -> inbox (daftar submitted)
exports.getInbox = async (req, res, next) => {
  try {
    res.render('inbox', { title: 'Inbox Persetujuan' });
  } catch (error) {
    next(error);
  }
};

// GET /approval/history -> history keputusan
exports.getHistory = async (req, res, next) => {
  try {
    res.send('History Page');
  } catch (error) {
    next(error);
  }
};

// GET /approval/rekap/export -> export PDF/Excel
exports.exportRekap = async (req, res, next) => {
  try {
    res.send('Export Rekap');
  } catch (error) {
    next(error);
  }
};

// GET /approval/:id -> detail permintaan
exports.getDetail = async (req, res, next) => {
  try {
    res.render('detail', { title: 'Detail Persetujuan', id: req.params.id });
  } catch (error) {
    next(error);
  }
};

// POST /approval/:id/approve -> approve (modal)
exports.approveRequest = async (req, res, next) => {
  try {
    res.redirect('/approval');
  } catch (error) {
    next(error);
  }
};

// POST /approval/:id/reject -> reject + catatan (modal)
exports.rejectRequest = async (req, res, next) => {
  try {
    res.redirect('/approval');
  } catch (error) {
    next(error);
  }
};

// GET /api/approval/:id/status -> REST API status
exports.getApiStatus = async (req, res, next) => {
  try {
    res.json({ id: req.params.id, status: 'pending' });
  } catch (error) {
    next(error);
  }
};
