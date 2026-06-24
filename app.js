require('dotenv').config();
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const session = require('express-session');
const MySQLStore = require('express-mysql-session')(session);
const fs = require('fs');

const indexRouter = require('./routes/index');
const authRouter = require('./routes/auth');
const pegawaiRouter = require('./routes/pegawai');
const pimpinanRouter = require('./routes/pimpinan');
const apiRouter = require('./routes/api');

const { notFoundHandler, errorHandler } = require('./middlewares/error');

const app = express();

// Ensure upload directories exist
const uploadDocs = path.join(__dirname, 'public/uploads/documents');
const uploadReceipts = path.join(__dirname, 'public/uploads/receipts');
if (!fs.existsSync(uploadDocs)) fs.mkdirSync(uploadDocs, { recursive: true });
if (!fs.existsSync(uploadReceipts)) fs.mkdirSync(uploadReceipts, { recursive: true });

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
  port: process.env.DB_PORT || 3306,
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

// Session message/user variables globally exposed to EJS
app.use((req, res, next) => {
  res.locals.success = req.session.success || null;
  res.locals.error = req.session.error || null;
  res.locals.warning = req.session.warning || null;
  
  delete req.session.success;
  delete req.session.error;
  delete req.session.warning;

  res.locals.user = req.session.userId ? {
    id: req.session.userId,
    username: req.session.username,
    role: req.session.role,
    employeeId: req.session.employeeId,
    name: req.session.name
  } : null;
  
  next();
});

app.use('/', indexRouter);
app.use('/', authRouter);
app.use('/pegawai', pegawaiRouter);
app.use('/pimpinan', pimpinanRouter);
app.use('/api', apiRouter);

// catch 404 and forward to error handler
app.use(notFoundHandler);

// error handler
app.use(errorHandler);

module.exports = app;
