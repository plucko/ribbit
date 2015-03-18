var passport = require('passport');
var GithubStrategy = require('passport-github').Strategy;
var githubApp = require('./githubapp.js');
var auth = require('./auth.js');
var util = require('./utility');
var handler = require('./request-handler.js');
var express = require('express');
var bodyParser = require('body-parser')

var app = express();

// Define available rooms
var rooms = {};

app.use(express.static(__dirname + '/../client'));

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

// Use passport to authenticate
app.use(passport.initialize());
app.use(passport.session());

// Use Github authentication
passport.use(new GithubStrategy({
  clientID: githubApp.clientID,
  clientSecret: githubApp.secret,
  callbackURL: 'http://127.0.0.1:4568/auth/callback'
}, function(accessToken, refreshToken, profile, done){
  done(null, {
    accessToken: accessToken,
    profile: profile
  });
}));

passport.serializeUser(function(user, done){
  done(null, user);
});

passport.deserializeUser(function(user, done){
  done(null, user);
}

// In auth page to authenticate, might need to move it. 
app.get('/auth', passport.authenticate('github'));
app.get('/auth/error', auth.error);
app.get('/auth/callback', 
  passport.authenticate('github', {failureRedirect: '/auth/error'}),
  auth.callback
);

// Lecturer post room logic
app.post('/rooms', util.checkUser, util.checkRoom, function(req, res, rooms){
  handler.checkRoom(req, res, rooms);
});

var server = app.listen(8000, function(){
    console.log('App connected');
});