require('dotenv').config();

var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var session = require('express-session');
var MySQLStore = require('express-mysql-session')(session);

var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');
var adminRouter = require('./routes/admin');

var remindersRouter = require('./routes/reminders');
var checkinsRouter = require('./routes/checkins');
var attendancesRouter = require('./routes/attendances');
var apiAkramRouter = require('./routes/apiAkram');

var apiGhufranRouter = require('./routes/apiGhufran');
var registrationsRouter = require('./routes/registrations');
var ticketsRouter = require('./routes/tickets');

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
});

app.use(
  session({
    key: 'session_cookie_name',
    secret: process.env.SESSION_SECRET || 'secret',
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    cookie: {
      maxAge: 1000 * 60 * 60 * 24,
    },
  })
);

// Main routes
app.use('/', indexRouter);
app.use('/users', usersRouter);

// Akram routes
app.use('/reminders', remindersRouter);
app.use('/checkins', checkinsRouter);
app.use('/attendances', attendancesRouter);
app.use('/api/akram', apiAkramRouter);

// Ghufran routes
app.use('/events', registrationsRouter);
app.use('/registrations', registrationsRouter);
app.use('/tickets', ticketsRouter);
app.use('/api/ghufran', apiGhufranRouter);

// Admin routes
app.use('/admin', adminRouter);

// catch 404 and forward to error handler
app.use(notFoundHandler);

// error handler
app.use(errorHandler);

module.exports = app;