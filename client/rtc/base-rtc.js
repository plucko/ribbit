// RibbitBaseRTC allows you to manage multiple WebRTC peer connections.
// It establishes a connection with the signal server and processes
// incoming messages, creating new peer connections in response to 
// offers, updating remote descriptions in response to answers, and
// adding ice candidates as they come in.
//
// It does not manage media streams or setting event handlers for 
// onaddstream, etc. Subclasses or clients can add these after
// initializing the base class or extend createConnectionTo.

var makeBaseRTC = function (options) {

  var baseRTC = {};
  baseRTC.signalServer = new WebSocket(options.signalServer);
  baseRTC.peerConnectionConfig = options.peerConnectionConfig;

  // Index peer connections by remote user.
  baseRTC.peerConnections = {};
  
  // Get local media stream, store it in this.localStream, and add it to all peer connections.
  baseRTC.getMedia = function (constraints, success, error) {
    constraints = constraints || { video: true, audio: true };
    error = error || function () {};
    
    var mediaSuccess = function (stream) {
      this.localStream = stream; 
      // Add our media stream to any peer connections we already have
      for (var remote in this.peerConnections) {
        this.peerConnections[remote].addStream(stream);
      }
      // Allow caller to do what they want with the stream
      success && success(stream);  //onmedia callback -- turn into an event
    }.bind(this);

    navigator.getUserMedia(constraints, mediaSuccess, error)
  };

  // Create a peer connection, and set it up to trickle ICE candidates
  // and have access to our local media stream (if we have one). It's up
  // to the caller to generate an offer/answer if that's what it
  // wants to do.
  baseRTC.getPeerConnection = function (remoteUser) {
    if (!remoteUser) throw new Error('baseRTC.getPeerConnection: cannot create new peer connection without remote user');

    // return already established connection if we have one
    if (this.peerConnections[remoteUser]) {
      return this.peerConnections[remoteUser];
    }

    var pc = new RTCPeerConnection(this.peerConnectionConfig);

    // add peerConnection event handlers 
    // update so we pass pc to each handler...
    for (var e in this.handlers) {  
      pc[e] = this.handlers[e]; // e.g. onaddstream
    }

    // Send ICE candidates to remote peer as they are added
    pc.onicecandidate = function (event) {
      if (event.candidate !== null) {
        this._send({ 'ice': event.candidate }, remoteUser, 'ice');
      }
    }.bind(this);

    // add our media stream if we have one
    if (this.localStream) {
      pc.addStream(this.localStream);
    }

    // finally, add new peer connection to our cache
    this.peerConnections[remoteUser] = pc;
    return pc;
  };

  // Subclasses must implement -- some will connect to a room, others to a user!
  baseRTC.connect = function (room, user) {
  }

  // Issue a request to all clients in room to send an offer. Clients respond
  // with an offer that we can then give an answer to. As a rule we only create
  // offers for individual users, so if we don't know who the users are, we just 
  // as a group to send us offers.
  baseRTC.connectToRoom = function (room) {
    this._send({ 'requester': this.me }, 'everyone', 'request-for-offer'); //TODO: don't use 'everyone' as user. Find a better way to indicate we want to send a message to all clients
  };

  // Create peer connection to a specific user
  baseRTC.connectToUser = function (remoteUser) {
    var pc = this.getPeerConnection(remoteUser);
    pc.createOffer(function(description) {
      pc.setLocalDescription(description, function () {  //must set local desc before sending offer!
        this._send(description, remoteUser, 'offer'); 
      }.bind(this));
    }.bind(this), function (err) { console.log('offer erorr: ', err)});
  };

  // Helper method to send a message to a specific recipient
  baseRTC._send = function (message, recipient, messageType) {
    this.signalServer.send(JSON.stringify({
      sender: this.me,
      room: this.room,
      recipient: recipient, 
      type: messageType,
      contents: message
    }));
  };

  // See _send for message.data structure
  baseRTC._gotSignalMessage = function (message) {
    var data = JSON.parse(message.data);
    console.log(data);
    if (!data.sender) return; // just ignore, though ultimately, server shouldn't send these
    //TODO: find a better way to indicate a message goes to everyone (at least include room check)
    if (data.recipient !== this.me && (data.recipient !== 'everyone' || data.sender === this.me)) { // || data.room !== this.room)) {
      return; // not addressed to me... signal server shouldn't have sent to me in the first place
    }      
    
    // get peer connection for sender (or create one if we don't have one yet)
    var pc = this.getPeerConnection(data.sender);

    // Respond to offer by setting new pc's remote description and sending an answer
    // that contains our description
    if (data.type === 'offer') {
      var self = this;
      var logErr = console.log.bind(console);
      pc.setRemoteDescription(new RTCSessionDescription(data.contents), function () {
        pc.createAnswer(function (answer) {
          pc.setLocalDescription(answer, function () {
            self._send(answer, data.sender, 'answer');
          }, logErr);
        }, logErr);
      }, logErr);

    // Respond to answers by just updating our remote description 
    } else if (data.type === 'answer') {
      pc.setRemoteDescription(new RTCSessionDescription(data.contents));
    // Add ICE Candidates as they come in
    } else if (data.type === 'ice') {
      pc.addIceCandidate(new RTCIceCandidate(data.contents.ice));
    // Send an offer if asked  
    } else if (data.type === 'request-for-offer') {
      this.connectToUser(data.contents.requester);
    }
  };

  baseRTC.signalServer.onmessage = baseRTC._gotSignalMessage.bind(baseRTC);

  var handlers = baseRTC.handlers = {};
  baseRTC.on = function (event, handler) {
    //add to existing connections
    for (var u in this.peerConnections) {
      this.peerConnections[u][event] = handler;
    }
    handlers[event] = handler //only one handler per event for now
    //save so we can add to future connections
    // handlers[event] = handlers[event] || [];
    // handlers[event].push(handler);
  };
  return baseRTC;

};


angular.module('ribbitBaseRTC', [])
  // .factory('BaseRTC', function () {
  //   return RibbitBaseRTC; //return constructor!
  // })
  .provider('baseRTC', function () {
    console.log('hey! in the provider')

    var signalServer;
    this.setSignalServer = function(url) {
      signalServer = url;
    };

    var peerConnectionConfig;
    this.setPeerConnectionConfig = function (config) {
      peerConnectionConfig = config;
    };

    this.$get = [function () {
      if (!signalServer) {
        throw Error('RTC Config Error: you must set the signal server in angular.config: BaseRTCProvider.setSignalServer(<url for your signal server>)');
      }
      return makeBaseRTC({ 
        signalServer: signalServer, 
        peerConnectionConfig: peerConnectionConfig 
      });
    }]  
  })
  .config(['baseRTCProvider', function(baseRTCProvider) {
    console.log('hey! in the confige')

    baseRTCProvider.setSignalServer('ws://localhost:3434'); //normally must be set up by app

    baseRTCProvider.setPeerConnectionConfig({
      'iceServers': [
        {'url': 'stun:stun.services.mozilla.com'}, 
        {'url': 'stun:stun.l.google.com:19302'}
      ]
    });
  }]);



