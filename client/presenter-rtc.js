// PresenterRTC has two unique features:
// - Its connect method establishes a peer connection with each
//   audience member in the room. It does this by asking everyone 
//   in the room to send an offer for it can respond to
// - It does not get a local media stream

angular.module('micControllers', ['ribbitBaseRTC'])
  .factory('presenterRTC', function (baseRTC) {
    
    baseRTC.connect = function(room, name) {
      this.room = room;
      this.me = name;
      this.connectToRoom(this.room); 
    };

    return baseRTC;
  });
