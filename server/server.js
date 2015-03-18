var express = require('express');
var bodyParser = require('body-parser')


var app = express();

app.use(express.static(__dirname + '/../client'));

app.use( bodyParser.json() );
app.use(bodyParser.urlencoded({
  extended: true
})); 

app.get('/', function(req, res) {
  res.send('connected');
});

app.post('/roomCheck', function(req, res) {
  console.log(req.body);
  console.log('in the roomCheck get route, checking if room exists');
  res.send('1');
});

app.get('/isPresenter', function(req, res) {
  console.log('in the isPresenter get route, checking if user is the presenter for the room');
  res.send('PresenterBrian');
});

app.post('/joinRoom', function(req, res) {
  console.log('made it to joinroom');
  res.send(req);
});

var server = app.listen(8000, function(){
    console.log('App connected');
});