var micControllers = angular.module('micControllers', []);

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
      console.log('promise has resolved')
    }).finally(function(){
      console.log('do something')
    })

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
  $scope.data = [];

  $scope.createRoom = function(room) {
    var successCb = function(result) {
      console.log('logging the success result from calling the createRoom function', result);
      $location.url('/presenter');
    };

    var errorCb = function(err) {
      console.error('logging the error from calling the createRoom function', err);
      $location.url('/main');
    };

    var notifyCb = function(result) {
      console.log('logging the notification result from calling the createRoom function', result);
    };

    room = room || 'testRoom';
    // $location.url('/presenter');
    var roomCheck = Room.tryToMakeRoom(room);
    
    console.log(roomCheck);
    
    roomCheck
      .catch(function(err) {
        console.error(err);
      })
      .then(successCb, errorCb, notifyCb);
    
    console.log('let\'s create a room!');
  };

  $scope.joinRoom = function(room) {

    var successCb = function(result) {
      console.log(result);
      $location.url('/audience');
    };

    var errorCb = function(err) {
      console.error(err);
      $location.url('/main');
    };

    var notifyCb = function(result) {
      console.log(result);
    };

    // Send in the roomname to allow the server to check if the room exists.
    // If it does, the server will respond by sending back an object or string
    // that will show who the presenter for the room is.
    // We will use the presenter string/object to tell the audienceRTC who to
    // connect to.

    var returnPresenter = Room.returnPresenter(room); 
    console.log(returnPresenter);
    returnPresenter
      .catch(function(err) {
        console.error(err);
      })
      .then(successCb, errorCb, notifyCb);

    $location.url('/audience');
    console.log('let\'s join a room!', room);
    // Room.joinRoom(room);
  };

}]);

micControllers.controller('AudienceControl', ['$scope', function($scope) {
  $scope.toggle = function() {
    console.log("toggle");
  };
}]);
  
micControllers.controller('PresenterControl', ['$scope', function($scope) {
  $scope.users = [{'name': 'hey'}, {'name': 'bye'}, {'name': 'sigh'}];
  $scope.mute = function(speaker) {
    console.log('mute function responds', speaker)
  };
}]);