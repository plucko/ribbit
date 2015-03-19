// RibbitBaseRTC allows you to manage multiple WebRTC peer connections.
// It establishes a connection with the signal server and processes
// incoming messages, creating new peer connections in response to 
// offers, updating remote descriptions in response to answers, and
// adding ice candidates as they come in.
//
// It does not manage media streams or setting event handlers for 
// onaddstream, etc. Subclasses or clients can add these after
// initializing the base class or extend createConnectionTo.

// Define the baseRTC constructor function which will be used to instantiate one baseRTC instance.
var makeBaseRTC = function (options) {

  // Add the signal server and connection configuration options to the constructed object
  // based on the options object passed in at instantiation time.
  var baseRTC = {};
  baseRTC.signalServer = new WebSocket(options.signalServer);
  baseRTC.peerConnectionConfig = options.peerConnectionConfig;

  // Index peer connections by remote user. Maintains a reference to all peer connections.
  baseRTC.peerConnections = {};
  
  // Get local media stream, store it in this.localStream, and add it to all peer connections.
  baseRTC.getMedia = function (constraints, success, error) {
    // Defines which hardware components the user must grant ribbit access to (video = camera, audio = microphone).
    constraints = constraints || { video: true, audio: true };
    error = error || function () {};
    
    // Define success function to handle stream after user agrees to grant access to the microphone.
    var mediaSuccess = function (stream) {
      this.localStream = stream; 
      // Add our media stream to any peer connections we already have
      for (var remote in this.peerConnections) {
        this.peerConnections[remote].addStream(stream);
      }
      // Provide getMedia's success callback function access to the stream.
      success && success(stream);  //onmedia callback -- turn into an event
    }.bind(this);

    // Browser-based function to request access to users camera and/or whatever is defined by the constraints.
    // This method is normalized across browsers in rtc-normalizer. Takes success and error callback functions.
    navigator.getUserMedia(constraints, mediaSuccess, error);
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

    // RTCPeerConnection is WebRTC's abstraction permitting audio and video connections between peers.
    // This object manages local video/audio setting information and handles the network addresses peers will use to connect.
    var pc = new RTCPeerConnection(this.peerConnectionConfig);

    // add peerConnection event handlers 
    // update so we pass pc to each handler...
    for (var e in this.handlers) {  
      pc[e] = this.handlers[e]; // e.g. onaddstream
    }

    // This handler is called when network candidates become available.
    // Sends ICE candidates to remote peer as they are added.
    // ICE Candidates are transport addresses existing on each peers' machine, a combination of IP address and port for a particular transfer protocol.
    // ICE basically analyzes all of the candidates (transport addresses) between two peers. Not all candidates will work together, so ICE is responsible for finding a suitable match.
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
  };

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
    // createOffer method generates an offer (SDP session description) that will be sent to peer.
    pc.createOffer(function(description) {
      // Before the offer is sent to the peer, the local description must be set to match the offer.
      pc.setLocalDescription(description, function () {
        // The offer is stringified utilizing the _send helper method below.
        this._send(description, remoteUser, 'offer'); 
      }.bind(this));
    }.bind(this), function (err) { console.log('offer erorr: ', err); });
  };

  // Helper method to send a message to a specific recipient
  baseRTC._send = function (message, recipient, messageType) {
    // Since SDPs are not natively JavaScript, the SDP is encapsulated in a SessionDescription object.
    this.signalServer.send(JSON.stringify({
      sender: this.me,
      room: this.room,
      recipient: recipient, 
      type: messageType,
      contents: message
    }));
  };

  // _gotSignalMessage handles peers accepting offers from other peers.
  baseRTC._gotSignalMessage = function (message) {
    // See _send for message.data structure
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
      // Provide local RTCPeerConnection with all the necessary details about the remote peer, provided in the offer message
      pc.setRemoteDescription(new RTCSessionDescription(data.contents), function () {
        // Generate the message 'answer' that will be the response to the offer made by the remote peer.
        pc.createAnswer(function (answer) {
          // Set local description and utilize the local description as the answer to the offer.
          pc.setLocalDescription(answer, function () {
            // Use signal server to stringify answer and send back to peer that made the offer.
            self._send(answer, data.sender, 'answer');
          }, logErr);
        }, logErr);
      }, logErr);

    // Accept answers by just updating our remote description 
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

  // Setup event handlers for baseRTC object.
  var handlers = baseRTC.handlers = {};
  baseRTC.on = function (event, handler) {
    // Add event handlers to all existing peer connections.
    for (var u in this.peerConnections) {
      this.peerConnections[u][event] = handler;
    }
    handlers[event] = handler; //only one handler per event for now
    // save so we can add to future connections
    // handlers[event] = handlers[event] || [];
    // handlers[event].push(handler);
  };

  // Return completed baseRTC object from constructor function.
  return baseRTC;
};


angular.module('ribbitBaseRTC', [])
  // .factory('BaseRTC', function () {
  //   return RibbitBaseRTC; //return constructor!
  // })
  .provider('baseRTC', function () {
    console.log('hey! in the provider');

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
    }];  
  })
  .config(['baseRTCProvider', function(baseRTCProvider) {
    console.log('hey! in the config');

    baseRTCProvider.setSignalServer('ws://localhost:3434'); //normally must be set up by app

    baseRTCProvider.setPeerConnectionConfig({
      'iceServers': [
        {'url': 'stun:stun.services.mozilla.com'}, 
        {'url': 'stun:stun.l.google.com:19302'}
      ]
    });
  }]);


