// Database configuration setup using Mongo DB & Mongoose
var mongoose = require('mongoose');
// URI to azure Mongolab URI or localhost Mongo DB
mongoURI = 'mongodb://127.0.0.1/ribbit';
// mongoURI = process.evn.CUSTOMCONNSTR_MONGOLAB_URI || 'mongodb://localhost/ribbit';
mongoose.connect(mongoURI);

var db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function(){
  console.log("Mongodb connection open");
});

module.exports = db;

