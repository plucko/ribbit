// Subclass of RibbitBaseRTC specific to audience member connections:
// - transmit their audio stream to presenter
// - handle error and end events (NOT IMPLEMENTED)
// - connect to a specific room as a specific user (ROOM TBD)
// var RibbitAudienceRTC = function () {

angular.module('ribbitAudienceRTC', ['ribbitBaseRTC'])
  .factory('audienceRTC', function (baseRTC) {
    // Get media right away for audience members
    baseRTC.connect = function (room, user) {
      this.room = room;
      this.me = user;
      this.connectToUser(room.presenter);
    }
    return baseRTC;
  });


