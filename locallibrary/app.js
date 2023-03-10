var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');

var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');
// import routs for 'catalog' area of sites
var catalogRouter = require('./routes/catalog');
// require compression middleware
const compression = require('compression');
// require helmet middleware
const helmet = require('helmet');

// create Express application object 
var app = express();
// add helmet to middleware chain
app.use(helmet());
0000
// Connect to MongoDB
// Import the mongoose module
const mongoose = require('mongoose');

// Set up default mongoose connection
const mongoDB = "mongodb+srv://elsie915Atlas:myCode2013@cluster0.lc6m9st.mongodb.net/local_library?retryWrites=true&w=majority";

mongoose.connect(mongoDB, {useNewUrlParser: true,
useUnifiedTopology: true});

// Get the default connection
const db = mongoose.connection;

// Bind connection to error event (to get notification of connection errors)
db.on("error", console.error.bind(console, 'MongoDB connection error:'));


// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

// compress all routes with compression middleware
app.use(compression());

app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);
app.use('/users', usersRouter);
// add catalog routes to middleware chain
app.use('/catalog', catalogRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
