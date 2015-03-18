var micControllers = angular.module('micControllers', []);

micControllers.controller('IndexControl', ['$scope', function($scope) {

  $scope.logger = function() {
    console.log('hi');
  };

}]);

micControllers.controller('MainControl', ['$scope', '$location', 'Room', function($scope, $location, Room) {
  $scope.data = [];

  $scope.createRoom = function(room) {

    var successCb = function(result) {
      console.log(result);
      $location.url('/presenter');
    };

    var errorCb = function(err) {
      console.error(err);
      $location.url('/main');
    };

    var notifyCb = function(result) {
      console.log(result);
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
  }

  $scope.joinRoom = function(room) {
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