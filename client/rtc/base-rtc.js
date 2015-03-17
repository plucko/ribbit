// RibbitBaseRTC allows you to manage multiple WebRTC peer connections.
// It establishes a connection with the signal server and processes
// incoming messages, creating new peer connections in response to 
// offers, updating remote descriptions in response to answers, and
// adding ice candidates as they come in.
//
// It does not manage media streams or setting event handlers for 
// onaddstream, etc. Subclasses or clients can add these after
// initializing the base class or extend createConnectionTo.
var RibbitBaseRTC = function (user, options) {
  this.me = user;
  this.room = 'the conservatory'; //TODO: update with room once it start to matter

  this.signalServer = new WebSocket(options.signalServer || 'ws://localhost:3434');
  this.signalServer.onmessage = this._gotSignalMessage.bind(this);
  
  // Index peer connections by remote user.
  this.peerConnections = {}; 
};

// Create a peer connection, and set it up to trickle ICE candidates
// and have access to our local media stream (if we have one). It's up
// to the caller to add on onaddstream handler if it cares about 
// remote media streams, and to generate an offer/answer if that's what it
// wants to do.
RibbitBaseRTC.prototype.createConnectionTo = function (remoteUser) {
  if (!remoteUser) return; //TODO: better error handling

  var peerConnectionConfig = {
    'iceServers': [
      {'url': 'stun:stun.services.mozilla.com'}, 
      {'url': 'stun:stun.l.google.com:19302'}
    ]
  };

  var pc = new RTCPeerConnection(peerConnectionConfig);
  pc.onicecandidate = function (event) {
    if (event.candidate !== null) {
      this._send({ 'ice': event.candidate }, remoteUser, 'ice');
    }
  }.bind(this);

  if (this.localStream) {
    pc.addStream(this.localStream);
  }

  this.peerConnections[remoteUser] = pc;
  return pc;
};

// Help method to send a message to a specific recipient
RibbitBaseRTC.prototype._send = function (message, recipient, messageType) {
  this.signalServer.send(JSON.stringify({
    recipient: recipient, //signal server needs to figure out correct recipient
    sender: this.me,
    room: this.room,
    type: messageType,
    contents: message
  }));
};

// See _send for message.data structure
RibbitBaseRTC.prototype._gotSignalMessage = function (message) {
  var data = JSON.parse(message.data);

  if (!data.sender) return; //TODO: throw an error
  if (data.recipient !== this.me) return; // not addressed to me... signal server shouldn't have sent to me in the first place

  // Get peerConnection for sender, creating one if we don't already have one.
  // We should only create a new pc for offers; answers and ice candidates will 
  // (must!) already have a pc.
  var pc = this.peerConnections[data.sender] || this.createConnectionTo(data.sender);

  // Respond to offer by setting new pc's remote description and sending an answer
  // that contains our description
  if (data.type === 'offer') {
    var self = this;
    // Set our remote description to that of remote peer
    pc.setRemoteDescription(new RTCSessionDescription(data.contents), function () {
      // Create answer, which will contain our local description
      pc.createAnswer(function (answer) {
        // Update our local description
        pc.setLocalDescription(answer, function () {
          // Send answer (our local description) to remote peer
          self._send(answer, data.sender, 'answer');
        });
      });
    });

  // Respond to answers by just updating our remote description 
  } else if (data.type === 'answer') {
    pc.setRemoteDescription(new RTCSessionDescription(data.contents));

  // Add ICE Candidates as they come in
  } else if (data.type === 'ice') {
    pc.addIceCandidate(new RTCIceCandidate(data.contents.ice));
  }
};





