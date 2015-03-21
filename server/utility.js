// Check to see user login (normal login or Github)
exports.checkUser = function(req, res, next){
  console.log('in the checkUser utility function, logging req.user object', req.user);
  console.log('in the checkUser utility function, logging req.session object', req.session);
  if (req.user) {
    next();
  } else {
    res.send('0');
  }
};

// Generate new session for login user
exports.createSession = function(req, res, newUser){
  console.log('in the createSession utility function, logging req.session object', req.session);
  return req.session.regenerate(function(){
    req.session.user = newUser;
    res.send('0');
  });
};
