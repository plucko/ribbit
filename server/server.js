var express = require('express');
var app = express();

app.use(express.static('../client'));

app.get('/', function(req, res) {
    res.send('Connected');
});

var server = app.listen(8000, function(){
    console.log('App connected');
});