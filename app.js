const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });
var express = require('express');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var session = require('express-session');
var MySQLStore = require('express-mysql-session')(session);

var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');
var apiRouter = require('./routes/api');
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
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  createDatabaseTable: true,
  schema: {
    tableName: 'sessions',
    columnNames: {
      session_id: 'id',
      expires: 'last_activity',
      data: 'payload'
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
    maxAge: 1000 * 60 * 60 * 24
  }
}));

console.log('✓ Session middleware loaded');

app.use('/', indexRouter);
console.log('✓ Index router loaded');

app.use('/users', usersRouter);
console.log('✓ Users router loaded');

app.use('/api', apiRouter);
console.log('✓ API router loaded');

app.use('/equipment-loans', require('./routes/equipment-loans'));
console.log('✓ Equipment loans router loaded');

app.use('/manager', require('./routes/manager'));
console.log('✓ Manager router loaded');

app.use(notFoundHandler);
app.use(errorHandler);

console.log('✓ App fully loaded');

module.exports = app;
