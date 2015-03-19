//TODO:
// - Move onaddstream handling to BaseRTC as general pc event handling
// - Add onremovestream
angular.module('ribbitPresenterRTC', ['ribbitBaseRTC']) //need ngSanitize for blob url: 
  .factory('presenterRTC', function (baseRTC) {

    baseRTC.connect = function(room, name) {
      this.room = room;
      this.me = name;
      this.connectToRoom(this.room); //TODO: check w/team on room object
    }
    return baseRTC;
  })
  .controller('presenterCtrl', function($scope, presenterRTC) {

    $scope.streams = [];

    presenterRTC.signalServer.onopen = function () {
      presenterRTC.connect('aviary', 'fred');  // presenter subclass knows how to handle this
    }

    var addVideoElem = function (stream) {
      console.log('adding video!')
      var vid = document.createElement('video');
      vid.muted = true;
      vid.autoplay = true;
      vid.src = window.URL.createObjectURL(stream); 
      document.getElementById('videos').appendChild(vid);
    }


    presenterRTC.on('onaddstream', function (event) {
      console.log('got remote stream!');
      addVideoElem(event.stream);
      // var streamSrc = $sce.trustAsResourceUrl(window.URL.createObjectURL(event.stream));
      // $scope.streams.push(streamSrc);
      // $scope.$apply();

    });


    // presenterRTC.on('removeremotestream', function (pc) {
    //   console.log('remotestream gone :(')
    // });

    // presenterRTC.on('audienceConnect', function (pc) {
    //   console.log('audience connected');
    // });

    // presenterRTC.on('audienceLeave', function (pc) {

    // });

    // presenterRTC.on('audience speak', function (pc) {

    // })

    // presenterRTC.on('audience stop speaking', function (pc) {

    // })

    // presenter.connect('backbone lecture', 'fred', function() {'success!'});

    // presenterRTC.closeAllConnections()
  })

