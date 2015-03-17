// Subclass of RibbitBaseRTC specific to audience member connections:
// - transmit their audio stream to presenter
// - handle error and end events (NOT IMPLEMENTED)
// - connect to a specific room as a specific user (ROOM TBD)
var RibbitAudienceRTC = function (user, options) {

  RibbitBaseRTC.call(this, user, options);

  var mediaSuccess = function (stream) {
    this.localStream = stream; 
    // Add our media stream to any peer connections we already have
    for (var remote in this.peerConnections) {
      this.peerConnections[remote].addStream(stream);
    }
    // Allow caller to do what they want with the stream
    options.onmedia && options.onmedia(stream);  //onmedia callback -- turn into an event
  }.bind(this);

  //Get media stream
  navigator.getUserMedia(
    options.constraints || { video: true, audio: true },
    mediaSuccess,
    options.mediaError || function() {} //NoOp default -- need to change
  );
};

RibbitAudienceRTC.prototype = Object.create(RibbitBaseRTC.prototype);
RibbitAudienceRTC.prototype.constructor = RibbitAudienceRTC;

// Connect audience member to a specific room
RibbitAudienceRTC.prototype.connect = function (room) {
  var lecturer = 'fred' //TODO: connect to specific room/lecture/presenter
  var pc = this.createConnectionTo(lecturer);
  pc.createOffer(function(description) {
    pc.setLocalDescription(description, function () {  //must set local desc before sending offer!
      this._send(description, lecturer, 'offer'); 
    }.bind(this));
  }.bind(this), function (err) { console.log('offer erorr: ', err)});

  return pc;
};