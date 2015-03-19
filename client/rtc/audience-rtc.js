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
    // baseRTC.getMedia({ video: true, audio: true}, function (stream) {
    //   document.getElementbyId('local-video').src = window.URL.createObjectURL(stream)
    // });
    return baseRTC;
  })
  .controller('audienceCtrl', function (audienceRTC) {
    audienceRTC.signalServer.onopen = function () {  //shouldn't have to mess with this here
      console.log('audience trying to connect')
      audienceRTC.getMedia({ video: true, audio: true }, function () {
        //let's see if this works -- only connecting after getMedia
        audienceRTC.connect({ roomname: 'aviary', presenter: 'fred' }, 'andy3');
      });
    }
  })



