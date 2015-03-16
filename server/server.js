var express = require('express');
var app = express();

app.use(express.static(__dirname + '/../client'));

app.get('/', function(req, res) {
    res.send('connected');
});

var server = app.listen(8000, function(){
    console.log('App connected');
});