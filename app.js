require('dotenv').config();
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var session = require('express-session');
var MySQLStore = require('express-mysql-session')(session);

// 1. Import Routes Baru
var indexRouter = require('./routes/index');
var pegawaiRouter = require('./routes/pegawai');
var atasanRouter = require('./routes/atasan');
var atasanLvl2Router = require('./routes/atasanLvl2');
var adminRouter = require('./routes/admin');

const { notFoundHandler, errorHandler } = require('./middlewares/error');

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
const sessionStore = new MySQLStore({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  // Tambahkan opsi schema ini agar Express membuat tabel baru bernama 'app_sessions'
  schema: {
    tableName: 'app_sessions'
  }
});

app.use(session({
  key: 'session_cookie_name',
  secret: process.env.SESSION_SECRET || 'rahasia-fakultas-spesial',
  store: sessionStore,
  resave: false,
  saveUninitialized: false,
  cookie: {
    maxAge: 1000 * 60 * 60 * 24 // 1 hari
  }
}));

// 2. Daftarkan Routes (Gantikan /users dengan rute aktor kalian)
app.use('/', indexRouter);
app.use('/pegawai', pegawaiRouter);
app.use('/atasan', atasanRouter);
app.use('/atasan-lvl2', atasanLvl2Router);
app.use('/admin', adminRouter);

// catch 404 and forward to error handler
app.use(notFoundHandler);

// error handler
app.use(errorHandler);

module.exports = app;