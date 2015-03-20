exports.callback = function(req, res){
  console.log('Login success');
  res.redirect('/#/main');
};

exports.error = function(req, res){
  res.send('Login Failed');
};

exports.auth = function(req, res, next){
  if (!req.isAuthenticated()) {
    res.send(401);
  } else {
    next();
  };
};