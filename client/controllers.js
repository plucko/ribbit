var micControllers = angular.module('micControllers', ['ribbitAudienceRTC', 'ribbitPresenterRTC', 'ngSanitize']);


micControllers.controller('AuthControl', ['$scope', 'Auth', function($scope, Auth) {

  $scope.normalLogin = function(username, password) {

    var successCb = function(result) {
      $location.url('/main');
    };

    var errorCb = function(err) {
      console.error(err);
      $location.url('/');
    };

    // var notifyCb = function(result) {
    //   console.log(result);
    // };

    var authPromise = Auth.normalLogin(username, password);

    authPromise.then(function() {
      // console.log('promise has resolved');
    }).finally(function(){
      // console.log('do something');
    });

    // authPromise
    //   .catch(function(err) {
    //     console.error(err);
    //   })
    //   .then(function(result) {
    //     console.log(result);
    //   });
      // successCb, errorCb, notifyCb);
  };

  $scope.signup = function(username, password) {
    Auth.signup(username, password)
      .catch(function(err) {
        // console.error(err);
      })
      .then(function(result) {
        // console.log(result);
      });
  };

  $scope.gitLogin = function() {
    Auth.gitLogin();
  };


}]);

micControllers.controller('MainControl', ['$scope', '$location', 'Room', function($scope, $location, Room) {
  // $scope.room;

  $scope.createRoom = function(room) {
    room = room || 'testRoom';
    var roomCheck = Room.tryToMakeRoom(room);
  };

  $scope.joinRoom = function(room) {

    // Send in the roomname to allow the server to check if the room exists.
    // If it does, the server will respond by sending back an object or string
    // that will show who the presenter for the room is.
    // We will use the presenter string/object to tell the audienceRTC who to
    // connect to.

    var returnPresenter = Room.returnPresenter($scope, room);
  };

}]);

// The AudienceController utilizes $rootScope to pass user information between controllers.
// This is not an ideal implementation, and the 'Room' service should be utilized instead.
micControllers.controller('AudienceControl', ['$scope', '$sce', 'audienceRTC', '$rootScope', function($scope, $sce, audienceRTC, $rootScope) {
  // Initialize micStatus with default settings of power = off (false) and the option to "Turn on your mic!"
  // The power boolean is utilized to determine whether the views mic button will open a new peer connection with the presenter or close an existing connection.
  // The command will toggle based on the power state so the user is aware what will happen.

  $scope.micStatus = {power: false, command: "Turn on your mic!"};

  // only provide connect and disconnect functionality after ready (signal server is up, we have a media stream)
  audienceRTC.ready(function () {
    $scope.roomName = $rootScope.details.roomname.slice();
    $scope.presenter = $rootScope.details.presenter.slice();
    $scope.username = $rootScope.details.username.slice();
    // access local media stream in audienceRTC.localStream
    // to use as a src in the DOM, you must run it through a couple functions:
    // - window.URL.createObjectURL to transform the stream object into a blob URL
    // - $sce.trustAsResourceUrl to let angular know it can trust the blob URL
    //   you need to inject $sce as a dependency (part of angular-sanitize, included in baseRTC)
    $scope.localStream = $sce.trustAsResourceUrl(window.URL.createObjectURL(audienceRTC.localStream));

    // utilize the audienceRTC factory (injected into the controller) to establish a connection with the presenter.
    // audienceRTC.connect will trigger baseRTC's connectToUser method.
    var openPeerConnection = function(roomName, presenter, username){
      audienceRTC.connect({ roomname: roomName, presenter: presenter }, username);
      $scope.micStatus.command = 'Turn off your mic!';
      $scope.micStatus.power = true;
    };

    // audienceRTC.disconnect will trigger baseRTC's disconnectFromUser method.
    var closePeerConnection = function(roomName, presenter, username){
      audienceRTC.disconnect({ roomname: roomName, presenter: presenter}, username);
      $scope.micStatus.command = 'Turn on your mic!';
      $scope.micStatus.power = false;
    };

    // based on the mics power attribute, determines whether to open or close a connection.
    $scope.connectionManager = function(){
      if(!$scope.micStatus.power){
        openPeerConnection($scope.roomName, $scope.presenter, $scope.username);
      }else{
        closePeerConnection($scope.roomName, $scope.presenter, $scope.username);
      }
    };

    // if you your handler updates the $scope, you need to call $scope.$apply
    // so angular knows to run a digest.
    $scope.$apply();
  });
  $scope.toggle = function() {
    // console.log("toggle");
  };

}]);


// The AudienceController utilizes $rootScope to pass user information between controllers.
// This is not an ideal implementation, and the 'Room' service should be utilized instead.
micControllers.controller('PresenterControl', ['$scope', '$sce', 'presenterRTC', '$rootScope', function($scope, $sce, presenterRTC, $rootScope) {
  var addVideoElem = function (url) {
    var vid = document.createElement('video');
    // vid.muted = true;
    vid.autoplay = true;
    vid.src = url;
    document.getElementById('videos').appendChild(vid);
  };

  $scope.connections = [];

  // only connect once our RTC manager is ready!
  presenterRTC.ready(function () {
    // the first arg here is the room object, the second is the name of the presenter.
    // $scope.createRoom = function(roomName, presenterName){
      // console.log('testing');
      presenterRTC.connect({ name: $rootScope.details.roomname, presenter: $rootScope.details.presenter}, $rootScope.details.presenter);
    // };
  });


  // register event handlers for peer connection events. MDN has a description of these events.
  // the remote user and peerconnection object are the last two arguments for any handler
  presenterRTC.on('onaddstream', function (event, remoteUser, pc) {
    // For onaddstream, you need to look in event.stream to get the media stream
    // See audience-1.html for description of trustAsResourceUrl and createObjectURL -- you need both!
    // NOTE: this doesn't yet seem to work when the stream is remote, though I'm pretty sure it should.
    // if you don't go through angular and instead just set the src w/vanillaJS it does work, so things
    // are fine on the RTC side...
    var stream = $sce.trustAsResourceUrl(window.URL.createObjectURL(event.stream));

    //Just testing w/vanillajs here, to make sure the remote stream actually works... angular can be fussy
    addVideoElem(stream);

    var connection = {
      stream: stream,
      user: remoteUser
    };

    $scope.connections.push(connection);

    // must call $scope.$apply so angular knows to run a digest
    $scope.$apply();
  });

  $scope.users = [{'name': 'hey'}, {'name': 'bye'}, {'name': 'sigh'}];
  $scope.mute = function(speaker) {
    // console.log('mute function responds', speaker);
  };
}]);

micControllers.config(['baseRTCProvider', function(baseRTCProvider) {

  baseRTCProvider.setSignalServer('ws://3a3cddc1.ngrok.com');
  // baseRTCProvider.setSignalServer('ws://localhost:3434'); //normally must be set up by app
  // baseRTCProvider.setSignalServer('ws://307a1d89.ngrok.com'); //normally must be set up by app

  baseRTCProvider.setPeerConnectionConfig({
    'iceServers': [
      {'url': 'stun:stun.services.mozilla.com'},
      {'url': 'stun:stun.l.google.com:19302'}
    ]
  });
}]);