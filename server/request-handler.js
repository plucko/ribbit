// After user login, send user to main page?
exports.loginUser = function(req, res){
  var username = req.data.username;
  var password = req.data.password;

  User.findOne( {username: username})
    .exec(function(err, user){
      if (!user){
        res.send('0');
      } else {
        var savedPassword = user.password;
        User.comparePassword(password, savedPassword, function(err, match){
          if(match){
            util.createSession(req, res, user);
            res.send('2');
          } else {
            res.send('0');
          }
        })
      }
    });
};

// First time user signup
exports.signupUser = function(req, res){
  var username = req.data.username;
  var password = req.data.password;

  User.findOne( {username: username})
    .exec(function(err, user){
      if (!user){
        var newUser = new User({
          username: username,
          password: password
        });
        newUser.save(function(err, newUser){
          if (err){
            res.send('0');
          }
          util.createSession(req, res, newUser);
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
    res.send('0');
  });
};

// If the room is available for creation, return 1
// If the room is already in the list, return 0
exports.checkRoom = function(req, res, rooms){
  var roomName = req.data.roomname;
  var lecturerName = req.data.name;

  for (var key in rooms){
    if (key === roomName){
      res.send('0');
      return;
    }
  }
  room[roomName] = {
    presenter: lecturerName,
    audience : {}
  };
  res.send('0');
  return room;
};

