// Check to see user login (normal login or Github)
exports.checkUser = function(req, res, next){
  if (req.user || req.session.passport !== {}) {
    console.log('in the checkUser utility function, about to execute next()');
    next();
  } else {
    console.log('in the checkUser utility function, about to have the response object send "0"');
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
