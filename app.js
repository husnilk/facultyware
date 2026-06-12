require('dotenv').config();
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var session = require('express-session');
var MySQLStore = require('express-mysql-session')(session);

var indexRouter = require('./routes/index');
var pegawaiRouter = require('./routes/pegawai');

const { notFoundHandler, errorHandler } = require('./middlewares/error');

var app = express();

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

const sessionStore = new MySQLStore({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
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
    maxAge: 1000 * 60 * 60 * 24
  }
}));

// Middleware global: inject req ke semua EJS view
app.use((req, res, next) => {
  res.locals.req = req;
  next();
});

app.use('/', indexRouter);
app.use('/pegawai', pegawaiRouter);
app.use('/api', require('./routes/api'));

app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;
