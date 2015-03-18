// Check to see user login (normal login or Github)
exports.checkUser = function(req, res, next){
  if (req.session.username || req.user) {
    next();
  } else {
    res.send('0');
  }
};

// Generate new session for login user
exports.createSession = function(req, res, newUser){
  return req.session.regenerate(function(){
    req.session.user = newUser;
    res.send('0');
  });
};
