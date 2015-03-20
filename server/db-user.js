var mongoose = require('mongoose');
var bcrypt = require('bcrypt-nodejs');
var bluebird = require('bluebird');
var findOrCreate = require('mongoose-findorcreate');


// Table Schema 
var userSchema = mongoose.Schema({
  username: { type: String, required: true, index: { unique: true } },
  password: {type: String, required: true},
  githubId: {type: String, required: true},
  githubName: {type:String, required: true}
});

userSchema.plugin(findOrCreate);

var User = mongoose.model('User', userSchema);

User.comparePassword = function(inputPassword, savedPassword, cb){
  bcrypt.compare(inputPassword, savedPassword, function(err, isMatch){
    if(err) return cb(err);
    cb(null, isMatch);
  });
};

// Use bcrypt to save all password
userSchema.pre('save', function(next){
  var cipher = bluebird.promisify(bcrypt.hash);
  return cipher(this.password, null, null).bind(this)
    .then(function(hash){
      this.password = hash;
      next();
    });
});

module.exports = User;