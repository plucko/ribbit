// Audience RTC:
//  - Acquires the user's local media stream right away, upon instantiating
//  - Connects specifically to the room's presenter.
// NOTE: The connect method must be passed a room that has a presenter property.
angular.module('micControllers', ['ribbitBaseRTC', 'ngSanitize'])
  .factory('audienceRTC', function (baseRTC) {

    // Get local media right away
    baseRTC.getMedia({ audio: true, video: true }); //TODO: take video out when done debugging

    baseRTC.connect = function (room, user) {
      this.room = room;
      this.me = user;
      this.connectToUser(room.presenter);
    };

    baseRTC.disconnect = function(room, user){
      this.disconnectFromUser(room.presenter);
    };
    
    return baseRTC;
  });


