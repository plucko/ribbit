var mongoose = require('mongoose');
// URI to azure Mongolab URI or localhost Mongo DB
mongoURI = 'mongodb://127.0.0.1/ribbit';
mongoose.connect(mongoURI);

var db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function(){
  console.log("Mongodb connection openMongodb connection openMongodb connection openMongodb connection openMongodb connection openMongodb connection openMongodb connection openMongodb connection openMongodb connection openMongodb connection openMongodb connection openMongodb connection openMongodb connection openMongodb connection openMongodb connection openMongodb connection open");
});

module.exports = db;

