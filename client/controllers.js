var micControllers = angular.module('micControllers', ['ribbitBaseRTC', 'ngSanitize']);

// Audience RTC:
//  - Acquires the user's local media stream right away, upon instantiating
//  - Connects specifically to the room's presenter.
// NOTE: The connect method must be passed a room that has a presenter property.
micControllers.factory('audienceRTC', function (baseRTC) {

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

// PresenterRTC has two unique features:
// - Its connect method establishes a peer connection with each
//   audience member in the room. It does this by asking everyone 
//   in the room to send an offer for it can respond to
// - It does not get a local media stream

micControllers.factory('presenterRTC', function (baseRTC) {
  
  baseRTC.connect = function(room, name) {
    this.room = room;
    this.me = name;
    this.connectToRoom(this.room); 
  };

  return baseRTC;
});

micControllers.controller('AuthControl', ['$scope', 'Auth', function($scope, Auth) {

  $scope.normalLogin = function(username, password) {

    var successCb = function(result) {
      console.log('made it to successCB of normalLogin controller');
      $location.url('/main');
    };

    var errorCb = function(err) {
      console.error(err);
      $location.url('/');
    };

    var notifyCb = function(result) {
      console.log(result);
    };

    console.log(username, password);

    var authPromise = Auth.normalLogin(username, password);

    console.log(authPromise);

    authPromise.then(function() {
      console.log('promise has resolved');
    }).finally(function(){
      console.log('do something');
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
    console.log('signing up');
    Auth.signup(username, password)
      .catch(function(err) {
        console.error(err);
      })
      .then(function(result) {
        console.log(result);
      });
  };

  $scope.gitLogin = function() {
    Auth.gitLogin();
    console.log('gitlogin');
  };


}]);

micControllers.controller('MainControl', ['$scope', '$location', 'Room', function($scope, $location, Room) {
  $scope.room;

  $scope.createRoom = function(room) {
    room = room || 'testRoom';
    var roomCheck = Room.tryToMakeRoom(room);
    console.log(roomCheck);
    console.log('let\'s create a room!');
  };

  $scope.joinRoom = function(room) {

    // Send in the roomname to allow the server to check if the room exists.
    // If it does, the server will respond by sending back an object or string
    // that will show who the presenter for the room is.
    // We will use the presenter string/object to tell the audienceRTC who to
    // connect to.

    var returnPresenter = Room.returnPresenter($scope, room); 
    console.log('logging the returnPresenter variable: ', returnPresenter);
    console.log('logging out $scope.room to see if we stored room info: ', $scope.room);
    console.log('let\'s join a room!' , room);
  };

}]);

micControllers.controller('AudienceControl', ['$scope', '$sce', 'audienceRTC', '$rootScope', function($scope, $sce, audienceRTC, $rootScope) {
  // Initialize micStatus with default settings of power = off (false) and the option to "Turn on your mic!"
  // The power boolean is utilized to determine whether the views mic button will open a new peer connection with the presenter or close an existing connection.
  // The command will toggle based on the power state so the user is aware what will happen.
  console.log('all about the details ------------');
  console.log($rootScope.details);

  $scope.micStatus = {power: false, command: "Turn on your mic!"};

  // only provide connect and disconnect functionality after ready (signal server is up, we have a media stream)
  audienceRTC.ready(function () {
    $scope.roomName = $rootScope.details.roomname.slice();
    console.log('logging out $scope.roomName from the AudienceControl: ', $scope.roomName);
    $scope.presenter = $rootScope.details.presenter.slice();
    console.log('logging out $scope.presenter from the AudienceControl: ', $scope.presenter);
    $scope.audienceMemberName = 'Joey';
    // access local media stream in audienceRTC.localStream
    // to use as a src in the DOM, you must run it through a couple functions:
    // - window.URL.createObjectURL to transform the stream object into a blob URL
    // - $sce.trustAsResourceUrl to let angular know it can trust the blob URL
    //   you need to inject $sce as a dependency (part of angular-sanitize, included in baseRTC)
    $scope.localStream = $sce.trustAsResourceUrl(window.URL.createObjectURL(audienceRTC.localStream));

    // utilize the audienceRTC factory (injected into the controller) to establish a connection with the presenter.
    // audienceRTC.connect will trigger baseRTC's connectToUser method.
    var openPeerConnection = function(roomName, presenter, audienceMemberName){
      audienceRTC.connect({ roomname: roomName, presenter: presenter }, audienceMemberName);
      $scope.micStatus.command = 'Turn off your mic!';
      $scope.micStatus.power = true;
    };

    // audienceRTC.disconnect will trigger baseRTC's disconnectFromUser method.
    var closePeerConnection = function(roomName, presenter, audienceMemberName){
      audienceRTC.disconnect({ roomname: roomName, presenter: presenter}, audienceMemberName);
      $scope.micStatus.command = 'Turn on your mic!';
      $scope.micStatus.power = false;
    };

    // based on the mics power attribute, determines whether to open or close a connection.
    $scope.connectionManager = function(){
      if(!$scope.micStatus.power){
        openPeerConnection($scope.roomName, $scope.presenter, $scope.audienceMemberName);
      }else{
        closePeerConnection($scope.roomName, $scope.presenter, $scope.audienceMemberName);
      }
    };

    // if you your handler updates the $scope, you need to call $scope.$apply
    // so angular knows to run a digest.
    $scope.$apply();
  });
  $scope.toggle = function() {
    console.log("toggle");
  };
}]);
  
micControllers.controller('PresenterControl', ['$scope', '$sce', 'presenterRTC', '$rootScope', function($scope, $sce, presenterRTC, $rootScope) {
  var addVideoElem = function (url) {
    console.log('adding video!');
    var vid = document.createElement('video');
    // vid.muted = true;
    vid.autoplay = true;
    vid.src = url;
    document.getElementById('videos').appendChild(vid);
  };

  $scope.connections = [];
  console.log($rootScope.details);
  // only connect once our RTC manager is ready!
  presenterRTC.ready(function () {
    // the first arg here is the room object, the second is the name of the presenter.
    // $scope.createRoom = function(roomName, presenterName){
      // console.log('testing');
      console.log($rootScope.details.roomname);
      console.log($rootScope.details.presenter);
      presenterRTC.connect({ name: $rootScope.details.roomname, presenter: $rootScope.details.presenter}, $rootScope.details.presenter); 
      console.log('testingEnd');
    // };
  });
  
  presenterRTC.on('onremovestream', function(event, remoteUser, pc){
    console.log('we are in here, finally -------');
    console.log(event);
    console.log(remoteUser);
    console.log(pc);
    // for(var i = $scope.connections.length-1; i >= 0; i--) {
    //   if( $scope.connections[i].user === remoteUser) $scope.connections.splice(i,1);
    //   return;
    // }
  });

  presenterRTC.on('oniceconnectionstatechange', function(event, remoteUser, pc){
    console.log('!!!!!!!!!!!!ice connection changed');
    console.log(event);
    console.log(remoteUser);
    console.log(pc);
    // for(var i = $scope.connections.length-1; i >= 0; i--) {
    //   console.log($scope.connections[i]);
    //   if( $scope.connections[i].user === remoteUser) $scope.connections.splice(i,1);
    //   return;
    // }
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
    console.log('mute function responds', speaker);
  };
}]);

micControllers.config(['baseRTCProvider', function(baseRTCProvider) {
  console.log('hey! in the config');

  baseRTCProvider.setSignalServer('ws://5df1e886.ngrok.com'); //normally must be set up by app
  // baseRTCProvider.setSignalServer('ws://307a1d89.ngrok.com'); //normally must be set up by app

  baseRTCProvider.setPeerConnectionConfig({
    'iceServers': [
      {'url': 'stun:stun.services.mozilla.com'}, 
      {'url': 'stun:stun.l.google.com:19302'}
    ]
  });
}]);