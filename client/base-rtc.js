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
  var baseRTC = {};

  // Track tasks that need to be done before we are 'ready', then
  // run more tasks once we're done with setup.
  var setupTasks = {};
  var onSetupComplete;
  baseRTC.ready = function (fn) {
    // After all setup tasks are complete, the callback function provided as an argument will be fired.
    // We are just storing the callback function here for later access via the maybeReady helper function.
    onSetupComplete = fn;
    // Check if all setup tasks are complete utilizing the maybeReady helper function defined below.
    maybeReady(); 
  };

  // This function checks to see if all the tasks required for setup are complete.
  // These tasks include:
  // 1. Opening a connection to the signal server utilizing web sockets
  // 2. Gaining access to the users hardware components (after a user accepts chromes request to give ribbit acces to the microphone, for example).
  var maybeReady = function () {
    var done = true;
    for (var task in setupTasks) {
      // If any task status is false, do not fire onSetupComplete.
      done = done && setupTasks[task]; 
    }
    if (done) onSetupComplete(); 
  };

  // Connect to our signal server. We talk with other clients over 
  // this server in order to establish peer connections to them.
  baseRTC.signalServer = new WebSocket(options.signalServer);
  //Wait for signal server connection to open before we're "ready"
  setupTasks.signalServer = false;
  baseRTC.signalServer.onopen = function () {
    setupTasks.signalServer = true;
    maybeReady();
  };

  // If this client will be streaming media to a peer, getMedia should be
  // called before initiating the handshake (offer/answer) process. (Adding
  // a stream after connection is established requires the connection to be 
  // renegotiated, a process we don't support now.)
  //
  // This method retrieves the media streams specified in the constraints
  // parameter. It saves the streams so we can pass them to our peer connections 
  // as we connect to them later.
  baseRTC.getMedia = function (constraints, success, error) {
    // Defines which hardware components the user must grant ribbit access to (video = camera, audio = microphone).
    constraints = constraints || { video: true, audio: true };
    error = error || function () {};

    setupTasks.getMedia = false;
    
    // Define success function to handle stream after user agrees to grant access to the microphone.
    var mediaSuccess = function (stream) {
      this.localStream = stream; 
      success && success(stream);

      setupTasks.getMedia = true;
      maybeReady();

    }.bind(this);

    // Browser-based function to request access to users camera and/or whatever is defined by the constraints.
    // This method is normalized across browsers in rtc-normalizer. Takes success and error callback functions.
    navigator.getUserMedia(constraints, mediaSuccess, error);
  };

  // Save off config RTCPeerConnection needs to know how to connect
  // to other clients
  baseRTC.peerConnectionConfig = options.peerConnectionConfig;

  // Maintain multiple peer connections, indexed by remote user
  baseRTC.peerConnections = {};
  


  // Create a peer connection, and set it up to trickle ICE candidates
  // and have access to our local media stream (if we have one). It's up
  // to the caller to generate an offer/answer if that's what it
  // wants to do.
  baseRTC.createPeerConnection = function (remoteUser) {
    if (!remoteUser) throw new Error('baseRTC.createPeerConnection: cannot create new peer connection without remote user');

    // RTCPeerConnection is WebRTC's abstraction permitting audio and video connections between peers.
    // This object manages local video/audio setting information and handles the network addresses peers will use to connect.
    var pc = new RTCPeerConnection(this.peerConnectionConfig);

    // Add all existing peerConnection event handlers to new peerConnections.
    // Handlers are registered via the baseRTC.on method defined below.
    // Make the remote user and peerConnection object available to the handler
    // The iterator e (stands for event) must be stored as a property on the function in order to give us closure access at the time the event handler needs triggered.
    // Otherwise, the iterator would progess to the end and the handler lookup would always be the last handler in the object.
    var that = this.handlers;
    for (var e in that) {
      pc[e] = function handler () {
        console.log(this);
        var func = that[handler.key];
        var args = Array.prototype.slice.call(arguments);
        args.push(remoteUser, pc);
        func.apply(undefined, args);
      };
      pc[e].key = e;
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

    // Add our media stream if we have one
    if (this.localStream) {
      pc.addStream(this.localStream);
    }

    // finally, add new peer connection to our cache
    this.peerConnections[remoteUser] = pc;
    return pc;
  };

  // Subclasses must implement -- some will connect to a room, others to a user.
  // In either case, the room is the room they are connecting to. It takes an 
  // object of the form: { name: 'living room', presenter: 'fred' }. The user
  // is the user they are connecting as (not who they are connecting to).
  baseRTC.connect = function (room, user) {
    console.log('ERROR: called connect method on base class. Subclasses must implement .connect');
  };

  baseRTC.disconnect = function (room, user) {
    console.log('ERROR: called connect method on base class. Subclasses must implement .connect');
  };

  // Ask all clients in room to send an offer. They all generate offers that
  // we can then give an answer to. Why do this? Because we don't know who else
  // is in the room, so we don't know what peer connections to generate so we can 
  // create offers. So instead, we ask for offers and now we know which peer 
  // connections to create.
  // TODO: fix the hacky way we're sending a message to the entire room. It shouldn't go to 'everyone'
  baseRTC.connectToRoom = function (room) {
    this._send({ 'requester': this.me }, 'everyone', 'request-for-offer'); 
  };

  // Create peer connection to a specific user and send them an offer. 
  baseRTC.connectToUser = function (remoteUser) {
    var pc = this.createPeerConnection(remoteUser);
    // createOffer method generates an offer (SDP session description) that will be sent to peer.
    pc.createOffer(function(description) {
      // Before the offer is sent to the peer, the local description must be set to match the offer.
      pc.setLocalDescription(description, function () {
        // The offer is stringified utilizing the _send helper method below.
        this._send(description, remoteUser, 'offer'); 
      }.bind(this));
    }.bind(this), function (err) { console.log('offer erorr: ', err); });
  };

  // Close peer connection to a specific user.
  // This method gets called by an audience member to turn off their mic and stop audio from streaming 
  baseRTC.disconnectFromUser = function(remoteUser){
    // Lookup user in peerConnections object;
    var pc = this.peerConnections[remoteUser];
    // Utilize built-in RTCPeerConnection close method https://developer.mozilla.org/en-US/docs/Web/API/RTCPeerConnection/close
    pc.removeStream(this.localStream);
    // pc.close();
  };

  // Helper method to send a message to a specific recipient. Make sure all 
  // messages are sent with a similar format. In particular, we need all messages
  // to have a sender, recipient, toom, and type. Otherwise, our onmessage handler
  // doesn't know what to do. See the handler for details on how these fields are used.
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

  // Handles the process of peers accepting offers from other peers.
  // Message structure is described in _send.
  var onMessage = function (message) {
    var data = JSON.parse(message.data);

    // Screen out messages we don't care about. This is a hack to make up 
    // for the signal server sending everything to everyone. Really, the
    // signal server should send a message if and only if we need to see it.
    if (!data.sender) return;
    if (data.recipient !== this.me && 
        (data.recipient !== 'everyone' || 
          data.sender === this.me)) {
          return;
    }           
    // Super useful for debugging. Most issues are somewhere in this function.
    console.log(data);

    // For offers and request-for-offers, we create a new peer connection, 
    // even if we already have one. For ice candidates and answers, we use
    // the peer connection we already have.
    var pc;

    // Respond to offer by setting new pc's remote description and sending an answer
    // that contains our description
    if (data.type === 'offer') {
      pc = this.createPeerConnection(data.sender);
      var self = this; //for _send below
      // Provide local RTCPeerConnection with all the necessary details about the remote peer, provided in the offer message
      pc.setRemoteDescription(new RTCSessionDescription(data.contents), function () {
        // Generate the message 'answer' that will be the response to the offer made by the remote peer.
        pc.createAnswer(function (answer) {
          // Set local description and utilize the local description as the answer to the offer.
          pc.setLocalDescription(answer, function () {
            // Use signal server to stringify answer and send back to peer that made the offer.
            self._send(answer, data.sender, 'answer');
          });
        });
      });

    // Send an offer if asked  
    } else if (data.type === 'request-for-offer') {
      pc = this.createPeerConnection(data.sender);
      this.connectToUser(data.contents.requester);

    // Respond to answers by just updating our remote description 
    } else if (data.type === 'answer') {
      pc = this.peerConnections[data.sender];
      pc.setRemoteDescription(new RTCSessionDescription(data.contents));

    // Add ICE Candidates as they come in -- the remote peer's oneicecandidate handler sends these
    } else if (data.type === 'ice') {
      pc = this.peerConnections[data.sender];
      pc.addIceCandidate(new RTCIceCandidate(data.contents.ice));

    // Oops! Where'd this message come from?
    } else {
      console.log('baseRTC:onMessage - unhandled message type: ' + data.type, data);
    }
  };
  
  // Use onMessage to handle messages coming from signal server
  baseRTC.signalServer.onmessage = onMessage.bind(baseRTC);

  // Peer connections emit events, like onaddstream and onremovestream.
  // .on allows you to specify handlers for those events. The handler
  // is added to any current peer connections. createPeerConnection
  // adds hanlders specified here to any new peer connections it creates.
  // Eventually, would like to support events not native to peer connections.
  // Note: the remote user and peer connection object are the last two arguments
  // passed to the handlers.
  var handlers = baseRTC.handlers = {};
  baseRTC.on = function (event, handler) {
    // Add to existing connections
    for (var u in this.peerConnections) {
      this.peerConnections[u][event] = handler;
    }
    // Save so we can add to peer connections we create in the future
    handlers[event] = handler; //only one handler per event for now
  };

  // Return completed baseRTC object from constructor function.
  return baseRTC;

};

// ********************
//    Angularization
// ********************
// We use a provider because there is app-level configuration
// that should not be hardcoded. Specifically, you must set:
// - The url of your signal server (which must use sockets)
// - The ICE servers that peer connections will use in figuring out
//   how to talk to each other.
//
// This is what a valid config looks like, though your specific config
// will be different:
// ```
// angular.module('yourApp')
//  .config(['baseRTCProvider', function(baseRTCProvider) {
//     baseRTCProvider.setSignalServer('ws://localhost:3434'); 
//     baseRTCProvider.setPeerConnectionConfig({
//       'iceServers': [
//         {'url': 'stun:stun.services.mozilla.com'}, 
//         {'url': 'stun:stun.l.google.com:19302'}
//       ]
//     });
//   }]);
// ```

angular.module('ribbitBaseRTC', ['ngSanitize'])
  .provider('baseRTC', function () {
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
        throw Error('RTC Config Error: you must set the signal server in angular.config, e.g.: BaseRTCProvider.setSignalServer("url for your signal server>")');
      }
      if (!peerConnectionConfig) {
        throw Error('RTC Config Error: you must set the peer connection configu in angular.config, e.g.: BaseRTCProvider.setPeerConnectionConfig({iceServers: [{url: <url>}, {url: <url>}]})');
      }

      return makeBaseRTC({ 
        signalServer: signalServer, 
        peerConnectionConfig: peerConnectionConfig 
      });
    }];  
  });




