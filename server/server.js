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
var url = require("url");
var app = express();

// Define existing rooms
var rooms = {};

app.use(express.static(__dirname + '/../client'));
app.use(cookieParser());
app.use( bodyParser.json() );
app.use(bodyParser.urlencoded({
  extended: true
})); 

// Prepare session for passport
app.use(session({saveUninitialized: true, resave: true, secret: 'this is our secret'}));
// Use passport to authenticate
app.use(passport.initialize());
app.use(passport.session());

// Use Github authentication, githubApp is ignored in the repo
passport.use(new GithubStrategy({
  clientID: githubApp.clientID,
  clientSecret: githubApp.secret,
  callbackURL: 'http://127.0.0.1:8000/auth/github/callback'
}, function(accessToken, refreshToken, profile, done){
  User.findOrCreate({githubId: profile.id, name: profile.displayName}, function(err, user) {
      return done(err, user);
  });
}));

// Passport session setup.
// To support persistent login sessions, Passport needs to be able to
// serialize users into and deserialize users out of the session. Typically,
// this will be as simple as storing the user when serializing, and finding
// the user when deserializing.
passport.serializeUser(function(user, done){
  done(null, user);
});

passport.deserializeUser(function(user, done){
  User.findById(id, function(err, user) {
  if (err) { return err;}
  done(null, user);
  });
});

// In auth page to authenticate, might need to move it. 
app.get('/auth/github', function(req, res, next) {
  next();
}, passport.authenticate('github', { failureRedirect: '/'}), function(req, res, next) {
  console.log('Authenticated through the github strategy, executing the next piece of middleware and redirecting to /main');
  console.log(req.user);
  res.redirect('/#/main');
});

app.get('/auth', passport.authenticate('github'));
app.get('/auth/error', auth.error);
app.get('/auth/github/callback', 
  passport.authenticate('github', {failureRedirect: '/auth/error'}),
  auth.callback
);

// Check user before served up
app.get('/', util.checkUser, function(req, res) {
    res.send('1');
});

// Handle login and logout
app.post('/login', handler.loginUser);
app.get('/logout', handler.logoutUser);

// Handle signup
app.post('/signup', handler.signupUser);

var inputRoom = pathname.toString().split();

// Student connect to the room
app.get('/rooms/*', util.checkUser, function(req, res, rooms) {
  var pathname = require('url').parse(request.url).pathname;
  var inputRoom = pathname.toString().split('/')[2];  //get the input and the room name
  rooms = handler.accessRoom(req, res, rooms, inputRoom); //
});

// Lecturer post room logic
app.post('/rooms', util.checkUser, function(req, res, rooms){
  handler.checkRoom(req, res, rooms);
});


var server = app.listen(8000, function(){
    console.log('App connected');
});