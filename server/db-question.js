var mongoose = require('mongoose');
var bluebird = require('bluebird');
var User = require('./db-user.js');

// Table Schema 
var questionSchema = mongoose.Schema({
  question: {type: String},
  user: [{type: mongoose.Schema.Types.ObjectId, ref: 'User'}]
});

var Question = mongoose.model('Question', questionSchema);

module.exports = Question;