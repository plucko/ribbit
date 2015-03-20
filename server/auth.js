exports.callback = function(req, res){
  console.log('Login success from auth.js\'s callback function');
  res.redirect('/#/main');
};

exports.error = function(req, res){
  console.log('login failed in server');
  res.redirect('/');
};

exports.auth = function(req, res, next){
  if (!req.isAuthenticated()) {
    res.send(401);
  } else {
    next();
  };
};