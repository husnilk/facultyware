require('dotenv').config();
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var session = require('express-session');
var MySQLStore = require('express-mysql-session')(session);
var methodOverride = require('method-override');

var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');
const equipmentRouter = require('./routes/equipments');
const equipmentCategoryRouter = require('./routes/equipmentCategories');
const apiRouter = require('./routes/api');
const { notFoundHandler, errorHandler } = require('./middlewares/error');
const { loadPermissions } = require('./middlewares/acl');

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// Method override untuk DELETE via _method di form
app.use(methodOverride(function (req, res) {
  if (req.body && typeof req.body === 'object' && '_method' in req.body) {
    const method = req.body._method;
    delete req.body._method;
    return method;
  }
}));

// Session configuration
const sessionStore = new MySQLStore({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT ? Number(process.env.DB_PORT) : 3306,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

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

// Pastikan sesi tersimpan ke store (MySQL async) SEBELUM redirect dikirim.
// Tanpa ini, browser bisa meminta halaman tujuan sebelum sesi ter-persist,
// sehingga data sesi (login, flash message) hilang secara intermiten.
app.use((req, res, next) => {
  const originalRedirect = res.redirect.bind(res);
  res.redirect = function (...args) {
    if (!req.session) return originalRedirect(...args);
    req.session.save((err) => {
      if (err) return next(err);
      originalRedirect(...args);
    });
  };
  next();
});

// Muat permission user ke res.locals (helper `can()` untuk semua view)
app.use(loadPermissions);

app.use('/', indexRouter);
app.use('/users', usersRouter);
app.use('/equipments', equipmentRouter);
app.use('/equipment-categories', equipmentCategoryRouter);
app.use('/api', apiRouter);

// catch 404 and forward to error handler
app.use(notFoundHandler);

// error handler
app.use(errorHandler);

module.exports = app;

