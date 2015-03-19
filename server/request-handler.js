// After user login, send user to main page?
var User = require('./db-user.js');

exports.loginUser = function(req, res){
  console.log(req.body);
  var username = req.body.username;
  var password = req.body.password;

  User.findOne( {username: username})
    .exec(function(err, user){
      if (!user){
        console.log('user not found');
        res.send('0');
      } else {
        console.log('user found, trying to match password');
        var savedPassword = user.password;
        User.comparePassword(password, savedPassword, function(err, match){
          if(match){
            console.log('user found and matched');
            util.createSession(req, res, user);
            res.send('2');
          } else {
            console.log('user found but not matched');
            res.send('0');
          }
        });
      }
    });
};

// First time user signup
exports.signupUser = function(req, res){
  var username = req.body.username;
  var password = req.body.password;
  console.log('made it to request handler"s signup user function');

  User.findOne( {username: username})
    .exec(function(err, user){
      if (!user){
        console.log('user not found in database, creating new user');
        var newUser = new User({
          username: username,
          password: password
        });
        newUser.save(function(err, newUser){
          if (err){
            res.send('0');
          }
          console.log('createing new session');
          util.createSession(req, res, newUser);
          console.log('created new session with newuser');
        });
      } else {
        console.log("Account already exists");
        res.send('0');
      }
    });
} ;

// When user logout
exports.logoutUser = function(req, res){
  req.session.destroy(function(){
    res.redirect('/');
  });
};

// If the room is available for creation, return 1
// If the room is already in the list, return 0
exports.checkRoom = function(req, res, rooms){
  var roomName = req.body.roomname;
  var lecturerName = req.body.name;

  for (var key in rooms){
    if (key === roomName){
      res.send('0');
      return;
    }
  }
  rooms[roomName] = {
    presenter: lecturerName,
    audience : {}
  };
  res.send('1');
  return room;
};
