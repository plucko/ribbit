// After user login, send user to main page?\
var User = require('./db-user.js');
var util = require('./utility.js');

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

// A function that 1.) checks if the room exists 2.) returns the room's
// information in the case that it exists. Otherwise sends '0'.
exports.checkPresenter = function(req, res, rooms) {
  var roomName = req.body.roomname;
  console.log('inside the request handler checkPresenter function, logging out req.body', req.body);

  for (var room in rooms) {
    if (room === roomName) {
      console.log('inside the checkPresenter handler function. Logging room: ', rooms[room]);
      res.send({roomname: room, presenter: rooms[room].presenter});
    }
  }
  res.send('0');
};

// If the room is available for creation, return 1
// If the room is already in the list, return 0
exports.checkRoom = function(req, res, rooms){
  if (req.session.passport.user === undefined) {
    res.send(401);
    return;
  }
  
  var roomName = req.body.roomname;
  var lecturerName = req.session.passport.user.username;

  console.log('inside the checkroom handler function. Logging req.body: ', req.body);
  console.log('inside the checkroom handler function. Logging roomName: ', roomName);
  console.log('inside the checkroom handler function. Logging lecturerName: ', lecturerName);

  for (var room in rooms){
    if (room === roomName){
      res.send('0');
      return;
    }
  }
  rooms[roomName] = {
    presenter: lecturerName,
    audience : []
  };
  res.send({rooms: rooms});
  return rooms[roomName] ;
};

// If the room is available for access, return 1
// If the room is already in the list, return 0
exports.accessRoom = function(req, res, rooms, inputRoom){
  // Get user 
  var studentName = req.body.name;

  // if room exists
  for (var key in rooms){
    if (key === inputRoom){
      // Add student to the room
      rooms[inputRoom][audience].push(studentName);
      res.send('1');
      return rooms;
    }
  }
  
  res.send('0');
  return rooms;
};
