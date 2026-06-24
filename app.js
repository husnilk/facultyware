require('dotenv').config();
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var session = require('express-session');

var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');
var surveyRouter = require('./routes/survey');
var adminSurveyRouter = require('./routes/adminSurvey');
var adminRespondenRouter = require('./routes/adminResponden');
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

app.use(session({
  secret: process.env.SESSION_SECRET || 'secret',
  resave: false,
  saveUninitialized: false,
  cookie: {
    maxAge: 1000 * 60 * 60 * 24
  }
}));

app.use('/', indexRouter);
app.use('/users', usersRouter);
app.use('/survey', surveyRouter);
app.use('/admin/survey', adminSurveyRouter);
app.use('/admin/responden', adminRespondenRouter);
app.use('/api', apiRouter);

app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;