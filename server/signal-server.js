// This is a simple web socket server. All it does is accept connections
// and rebroadcast messages from any client to all clients, including the 
// client that sent it (which we need for our test code to run with both 
// RTC clients in same browser... I think). 
var WebSocketServer = require('ws').Server;

var wsServer = new WebSocketServer({ port: 3434 });

// Utility function to broadcast a message to all connected clients, 
// totally indiscriminately
wsServer.broadcast = function (data) {
  this.clients.forEach(function (client) {
    client.send(data);  //send to all clients, including initial sender
  });
};

// When we get new connections, set each connection up with 
// an onmessage handler that will broadcast any messages it
// sends to all other connections (using the broadcast utility fn above)
wsServer.on('connection', function (ws) {
  ws.on('message', function (message) {
    console.log('broadcasting message', message);
    wsServer.broadcast(message);
  });
});