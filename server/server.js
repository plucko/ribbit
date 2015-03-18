var express = require('express');
var app = express();

app.use(express.static(__dirname + '/../client'));

app.get('/', function(req, res) {
  res.send('connected');
});

app.get('/roomCheck/*', function(req, res) {
  console.log(req.url);
  console.log('in the roomCheck get route, checking if room exists');
  res.send('1');
});

app.get('/isPresenter', function(req, res) {
  console.log('in the isPresenter get route, checking if user is the presenter for the room');
  res.send('1');
});

app.post('/joinRoom', function(req, res) {
  console.log('made it to joinroom');
  res.send(req);
});

var server = app.listen(8000, function(){
    console.log('App connected');
});