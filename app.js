const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });
var express = require('express');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var session = require('express-session');
var MySQLStore = require('express-mysql-session')(session);

var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');
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
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,

  createDatabaseTable: true,
  schema: {
    tableName: 'sessions', // Ubah menjadi 'sssion' jika memang namanya persis seperti itu
    columnNames: {
      session_id: 'id',           // Menerjemahkan session_id menjadi id
      expires: 'last_activity',   // Menerjemahkan expires menjadi last_activity
      data: 'payload'             // Menerjemahkan data menjadi payload
    }
  }
  
});

sessionStore.onReady().then(() => {
  console.log('MySQL session store ready');
}).catch(err => {
  console.error('MySQL session store error:', err.message);
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

app.use('/', indexRouter);
app.use('/users', usersRouter);

app.use('/equipment-loans', require('./routes/equipment-loans'));
app.use('/manager', require('./routes/manager'));
// catch 404 and forward to error handler
app.use(notFoundHandler);

// error handler
app.use(errorHandler);

module.exports = app;
