require('dotenv').config();
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var session = require('express-session');
var expressLayouts = require('express-ejs-layouts');

var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');
var bookingRouter = require('./routes/bookingRoutes');
const { notFoundHandler, errorHandler } = require('./middlewares/error');

var app = express();

// 1. SETUP VIEW ENGINE & ENGINE MASTER LAYOUT EJS
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.use(expressLayouts);
app.set('layout', 'layout'); 

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// 2. MIDDLEWARE CONFIG EXPRESS-SESSION
app.use(session({
  secret: 'facultyware-secret-session-key-2026',
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false } // Set ke true jika menggunakan HTTPS di server production
}));

// Mengatur variabel global agar otomatis terbaca di file views .ejs
app.use((req, res, next) => {
  res.locals.user = req.session.user || null;
  res.locals.title = 'Facultyware';
  next();
});

// 3. DAFTAR UTAMA ROUTING APLIKASI
app.use('/', indexRouter);
app.use('/users', usersRouter);
app.use('/bookings', bookingRouter); // Seluruh submenu booking diatur via bookingRouter

// 4. PENANGANAN ERROR GLOBAL
app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;