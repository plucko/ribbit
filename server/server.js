var passport = require('passport');
var GithubStrategy = require('passport-github').Strategy;
var githubApp = require('./githubapp.js');
var auth = require('./auth.js');
var util = require('./utility');
var handler = require('./request-handler.js');
var express = require('express');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var session = require('express-session');
var db = require('./db-config.js');
var User = require('./db-user.js');


var app = express();

// Define available rooms
var rooms = {};

app.use(express.static(__dirname + '/../client'));

app.use(cookieParser());

app.use( bodyParser.json() );
app.use(bodyParser.urlencoded({
  extended: true
})); 

app.get('/', util.checkUser, function(req, res) {
    res.send('1');
});

// Handle login and logout
app.post('/login', handler.loginUser);
app.get('/logout', handler.logoutUser);

// Handle signup
app.post('/signup', handler.signupUser);

// Check user before served up
app.get('/', util.checkUser, function(req, res) {
    res.send('1');
});

app.use(session({saveUninitialized: true, resave: true, secret: 'this is our secret'}));

// Use passport to authenticate
app.use(passport.initialize());
app.use(passport.session());

// Use Github authentication
passport.use(new GithubStrategy({
  clientID: githubApp.clientID,
  clientSecret: githubApp.secret,
  callbackURL: 'http://127.0.0.1:8000/auth/github/callback'
}, function(accessToken, refreshToken, profile, done){
  console.log('accessToken', accessToken);
  console.log('refreshToken', refreshToken);
  // console.log('profile', profile.displayName);
  User.findOrCreate({githubId: profile.id, username: profile.displayName}, function(err, user) {
    return done(err, user);
  });
  

  // return done(null, {
  //   accessToken: accessToken,
  //   profile: profile
  // });
}));

passport.serializeUser(function(user, done){
  console.log('user about to be serialized', user._id);
  done(null, user);
});

passport.deserializeUser(function(id, done){
  console.log('id to be used to deserialized', 'this is the id', id);
  User.find({githubId: id._id}, function(err, user) {
    if (err) { return err;}
    done(err, user);
  });
});


// User.findOrCreate({username:'Gary', password:'test', githubId:'123'}, function(err, user, created) {
//   console.log('A new user from "%s" was inserted', user.ip);
//   User.findOrCreate({}, function(err, click, created) {
//     console.log('Did not create a new user for "%s"', click.ip);
//   })
// });


// In auth page to authenticate, might need to move it. 
app.get('/auth/github', function(req, res, next) {
  console.log('in the /auth path, trying to authenticate the user with passport');
  next();
},
    passport.authenticate('github', { failureRedirect: '/auth/error'}), function(req, res, next) {
  console.log('Authenticated through the github strategy, executing the next piece of middleware and redirecting to /main');
  console.log(req.user);
  res.redirect('/#/main');
});


app.get('/auth/error', auth.error);
app.get('/auth/github/callback', 
  passport.authenticate('github', {failureRedirect: '/auth/error'}),
  auth.callback
);

app.get('/loggedin', function(req, res) {
  console.log('get request to /loggedin server path');
  console.log('inside get/logged in, req.isAuthenticated()', req.isAuthenticated());
  console.log('inside get/logged in, req.user', req.user);
  console.log('inside get/logged in, req.session', req.session)
  res.send(req.isAuthenticated() ? req.user : '0');
});

// Lecturer post room logic

app.post('/rooms', util.checkUser, function(req, res, next){
  console.log('post request to /rooms, logging req.user: ', req.user);
  console.log('post request to /rooms, logging req.session: ', req.session);
  handler.checkRoom(req, res, rooms);
});

app.post('/rooms/asAudience', util.checkUser, function(req, res, next){
  console.log('post request to /rooms/asAudience, logging req.user: ', req.user);
  console.log('post request to /rooms/asAudience, logging req.session: ', req.session);
  handler.checkPresenter(req, res, rooms);
});

var server = app.listen(8000, function(){
    console.log('App connected');
});