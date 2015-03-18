exports.callback = function(req, res){
  console.log('Login success');
  res.redirect('/');
};

exports.error = function(req, res){
  res.send('Login Failed');
};
