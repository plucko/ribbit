// Variables for managing connections and streams
var localVideo;
var remoteVideo;  
var localStream;  //not included in tutorial
var peerConnection;
var serverConnection;
var peerConnectionConfig = {
  'iceServers': [
    {'url': 'stun:stun.services.mozilla.com'}, 
    {'url': 'stun:stun.l.google.com:19302'}
  ]
}

// So we don't have to use prefixed methods later
navigator.getUserMedia = navigator.getUserMedia || navigator.mozGetUserMedia || navigator.webkitGetUserMedia;
window.RTCPeerConnection = window.RTCPeerConnection || window.mozRTCPeerConnection || window.webkitRTCPeerConnection;
window.RTCIceCandidate = window.RTCIceCandidate || window.mozRTCIceCandidate || window.webkitRTCIceCandidate;
window.RTCSessionDescription = window.RTCSessionDescription || window.mozRTCSessionDescription || window.webkitRTCSessionDescription;

  
// Run on load to initiate socket connection to our socket server
// and get video/audio streams from client device using getUserMedia.
function pageReady () {
  console.log('1. pageReady called')
  localVideo = document.getElementById('local-video');
  remoteVideo = document.getElementById('remote-video');

  // serverConnection = new WebSocket('ws://392f3dc0.ngrok.com');
  serverConnection = new WebSocket('ws://127.0.0.1:3434');

  // Set up event handler for handling socket messages.
  // These message contain either ice candidates and offers 
  // from remote clients.
  serverConnection.onmessage = gotMessageFromServer;

  var constraints = {
    video: true,
    audio: true
  };

  if (navigator.getUserMedia) {
    //Try to get a media stream and call getUserMediaSuccess (directly below) if we succeed
    //Note: there is no guarantee we call getUserMediaSuccess before we start receiving messages 
    //from our socket (that's a quirk of this implementation -- it's fragile)
    navigator.getUserMedia(constraints, getUserMediaSuccess, getUserMediaError);
  } else {
    console.log('no getUserMedia API')
  }
}

// Once we have access to media stream, convert our stream make it 
// the source for our local video and set localStream to make it
// available to other functions
// Note: this only gets called after user grants access to use mic 
// and camera
function getUserMediaSuccess (stream) {
  console.log('get user media success! Woot!')
  localStream = stream;
  localVideo.src = window.URL.createObjectURL(stream);  //cool! can just set src attr to a url-ified version of the stream
}

// Create a new RTCPeerConnection. This kicks off the signaling
// process. We set up handlers for when our connection receives 
// in ICE candidate (more below) and when the remote client
// adds a mediastream.
//
// A quirk of this implementation: Each time you call start, 
// we reset the peer connection, so you only want to click
// the button in ONE of your demo tabs. In the other, start (the function)
// is invoked from gotMessageFromServer
function start (isCaller) {
  peerConnection = new RTCPeerConnection(peerConnectionConfig);
  peerConnection.onicecandidate = gotIceCandidate;
  peerConnection.onaddstream = gotRemoteStream;  //event triggered when remote adds a media stream

  // Here we add our local stream to the connection. This will trigger onaddstream for any remote clients.
  peerConnection.addStream(localStream); 

  if (isCaller) {
    // We must create an offer (start signaling!) if we're the caller. 
    // Go to gotOfferDescription (below) once we have an offer ready.
    peerConnection.createOffer(gotOfferDescription, createOfferError);
  }
}

// Callback for creating an offer. The description contains the info 
// for remote clients to connect. We set our local description with 
// this info and then send it over the socket session to any other 
// listening clients.
function gotOfferDescription (description) {  //Andy: separating out answer and offer descriptions so I can see what's what
  console.log('got offer description', description);

  peerConnection.setLocalDescription(description, function () {
    serverConnection.send(JSON.stringify({'sdp': description}));
  }, function () { console.log('set description error'); });
}

// Call back for creating an answer. This code is identical to 
// getOfferDescription, except the text that we console.log.
// The only difference is that this is triggered after we create
// an answer in response to an offer. In both cases, we set the local
// descripton and then send it over the socket to the other client(s).
//
// This highlights that we have one js file that has code for two
// sides of the RTC relationship: caller and callee. 
// In our setup, one client should call the offer and the other 
// should call the answer, and neither should call both.
function gotAnswerDescription (description) {
  console.log('got answer description', description);

  peerConnection.setLocalDescription(description, function () {
    serverConnection.send(JSON.stringify({'sdp': description}));
  }, function () { console.log('set description error'); });
}


// What is ICE???? From MDN: http://www.html5rocks.com/en/tutorials/webrtc/basics/
// ICE is a framework for connecting peers, such as two video chat 
// clients. Initially, ICE tries to connect peers directly, with the
// lowest possible latency, via UDP. In this process, STUN servers have 
// a single task: to enable a peer behind a NAT to find out its public 
// address and port. (Google has a couple of STUN severs, one of which is 
// used in the apprtc.appspot.com example.)
//
// If UDP fails, ICE tries TCP: first HTTP, then HTTPS. If direct 
// connection fails—in particular, because of enterprise NAT traversal 
// and firewalls—ICE uses an intermediary (relay) TURN server. In other 
// words, ICE will first use STUN with UDP to directly connect peers and, 
// if that fails, will fall back to a TURN relay server. The expression 
// 'finding candidates' refers to the process of finding network interfaces 
// and ports.

function gotIceCandidate (event) {
  if (event.candidate !== null) {
    serverConnection.send(JSON.stringify({ 'ice': event.candidate }));
  }
}

// Invoked as event handler for onaddstream. When a remote client addds
// a mediastream, we run this code. It just takes the remote stream and 
// makes it the src for our remote video
function gotRemoteStream (event) {
  console.log('got remote stream', event);
  remoteVideo.src = window.URL.createObjectURL(event.stream);
}

// This is where we handle messages comming across our socket session. These
// messages could be session descriptions for remote clients or ICE candidates.
// This function figures out what the message is and handles it appropriately.
//
// If it's a session description for a remote client, we set our RTCPeerConnections's
// remote connection with that info and create an answer that will let the remote 
// client know how to connect to us. 
//
// If it's an ICE candidate, we add it to our connections set of ice candidates.
function gotMessageFromServer (message) {
  // We do not yet have initiated a peer connection, so start one!
  if (!peerConnection) start(false);  

  var signal = JSON.parse(message.data);
  if (signal.sdp) {  
    //We got connection info for a remote client, so respond with our own connection info
    peerConnection.setRemoteDescription(new RTCSessionDescription(signal.sdp), function () {
      peerConnection.createAnswer(gotAnswerDescription, createAnswerError); //this will generate an error if we initiated the offer in the first place--that's OK for now
    });
  } else if (signal.ice) {
    //We got a new ice candidate, so add it to the list
    peerConnection.addIceCandidate(new RTCIceCandidate(signal.ice));
  }
}


// Error Handlers -- just log what it's handling an error for
function createOfferError (error) {
  console.log('createOfferError', error);
}
function createAnswerError (error) {
  console.log('createAnswerError', error);
}
function getUserMediaError (error) {
  console.log('getUserMediaError', error);
}











