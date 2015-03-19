// Audience RTC:
//  - Acquires the user's local media stream right away, upon instantiating
//  - Connects specifically to the room's presenter.
// NOTE: The connect method must be passed a room that has a presenter property.

angular.module('ribbitAudienceRTC', ['ribbitBaseRTC'])
  .factory('audienceRTC', function (baseRTC) {

    // Get local media right away
    base.getUserMedia({ audio: true, video: true }); //TODO: take video out when done debugging

    baseRTC.connect = function (room, user) {
      this.room = room;
      this.me = user;
      this.connectToUser(room.presenter);
    }

    return baseRTC;
  });


