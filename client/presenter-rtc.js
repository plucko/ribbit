// This code is a duplicate of the code that exists in controllers.js.
// Ideally, the factories would be separate out from the controllers in this fashion.
// However, to limit moving parts in development, the logic utilized for the application currently exists in controllers.js.


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
