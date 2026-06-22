require('dotenv').config();
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var session = require('express-session');
var MySQLStore = require('express-mysql-session')(session);

var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');
var receivingRouter = require('./routes/receiving');
const { notFoundHandler, errorHandler } = require('./middlewares/error');
const purchaseController = require('./controllers/purchaseController');
const dashboardController = require('./controllers/dashboardController');

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// Session configuration
// Tabel `sessions` di DB ini bergaya Laravel (kolomnya berbeda dari yang
// diharapkan express-mysql-session), maka sesi Express disimpan di tabel
// terpisah `express_sessions` -- tidak mengganggu tabel `sessions` Laravel.
// Tabel dibuat lewat migration eksplisit: scripts/migrate_sessions_table.js
// (createDatabaseTable=false agar tidak membuat tabel diam-diam saat runtime).
//
// PENTING: express-mysql-session hanya meneruskan whitelist opsi ke mysql2
// (host, port, user, password, database) — ssl dan socketPath TIDAK diteruskan.
// Solusi: pakai pool yang sudah ada dari lib/db.js (yang sudah dikonfigurasi
// dengan ssl/socketPath) sebagai parameter kedua constructor.
const dbPool = require('./lib/db');

const sessionStore = new MySQLStore({
  createDatabaseTable: false,
  schema: {
    tableName: "express_sessions",
  },
}, dbPool);

app.use(session({
  key: 'session_cookie_name',
  secret: process.env.SESSION_SECRET || 'secret',
  store: sessionStore,
  resave: false,
  saveUninitialized: false,
  cookie: {
    maxAge: 1000 * 60 * 60 * 24 // 1 day
  }
}));

// Helper izin & format tanggal untuk view EJS
app.use((req, res, next) => {
  res.locals.can = (perm) => {
    return req.session && req.session.permissions && req.session.permissions.includes(perm);
  };
  // Format tanggal seragam (mis. "10 Mar 2025"); aman untuk null/invalid.
  res.locals.fmtDate = (d) => {
    if (!d) return '-';
    const dt = new Date(d);
    if (isNaN(dt.getTime())) return String(d);
    return dt.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
  };
  next();
});

app.use('/', indexRouter);
app.use('/users', usersRouter);
app.use('/receiving', receivingRouter);
app.use('/api/receiving', receivingRouter.apiRouter);
app.use('/purchase', require('./routes/purchase'));
app.use('/procurement', require('./routes/inventoryProcurement'));
app.use('/pengadaan', require('./routes/pengadaan'));
app.use('/approval', require('./routes/approval'));
app.use('/supplier', require('./routes/supplier'));

// Dashboard sebagai landing ter-autentikasi (semua role yang sudah login).
app.get('/dashboard', require('./middlewares/auth').isAuthenticated, dashboardController.getDashboardPage);
app.get('/dashboard/activity', require('./middlewares/auth').isAuthenticated, dashboardController.getActivityPage);
app.get('/api/dashboard/stats', require('./middlewares/auth').isAuthenticated, dashboardController.getStats);
app.get('/api/purchase', purchaseController.apiList);
app.get('/api/procurement', require('./middlewares/auth').isAuthenticated, require('./middlewares/acl').checkPermission('manage_procurement'), require('./controllers/inventoryProcurementController').apiList);

// catch 404 and forward to error handler
app.use(notFoundHandler);

// error handler
app.use(errorHandler);

module.exports = app;