var micServices = angular.module('micServices', []);

// '$q','$timeout','$http','$location','$rootScope',

micServices.factory('Room', ['$http', '$q','$timeout','$http','$location','$rootScope',
function roomFactory($http, $q, $timeout, $http, $location, $rootScope) {
  var result = {};


  // Taken and adapted from source code found in article
  // https://vickev.com/#!/article/authentication-in-single-page-applications-node-js-passportjs-angularjs


  result.tryToMakeRoom = function(room){
    // Initialize a new promise
    var deferred = $q.defer();

    var successCb = function(result) {
      $location.url('/presenter');
    };

    var errorCb = function(err) {
      console.error('logging the error from calling the createRoom function', err);
      $location.url('/main');
    };

    var notifyCb = function(result) {
      // console.log('logging the notification result from calling the createRoom function', result);
    };

    // Make an AJAX call to check if the user is logged in
    $http.post('/rooms', {roomname: room}).success(function(result){
      // Authenticated

      // Interacts with server code because server will be written something like
      // app.get('/loggedin', function(req, res) {
      // res.send(req.isAuthenticated() ? req.user : '0'); });
      if (result !== '0') {

        /*$timeout(deferred.resolve, 0);*/

        $rootScope.details = {'roomname': room, 'presenter': result.rooms[room].presenter};
        $rootScope.message = 'Room successfully created!';
        deferred.resolve(result);
      }
      // Not Authenticated
      else {
        $rootScope.message = 'Room already exists.';
        //$timeout(function(){deferred.reject();}, 0);
        deferred.reject();
        $location.url('/main');
      }
    });

    return deferred.promise.catch(function(err) {
        console.error(err);
      })
      .then(successCb, errorCb, notifyCb);
  };

  // Function to check if the user is the presenter for the room. There should
  // only be one presenter bound to each room, and anybody trying to request
  // access to the presenter's view and controller will be turned away if they
  // are not the presenter.

  result.returnPresenter = function($scope, room) {
    var deferred = $q.defer();

    var successCb = function(result) {
      $scope.room = result;
      $location.url('/audience');
      return result;
    };

    var errorCb = function(err) {
      console.error(err);
      $location.url('/main');
    };

    var notifyCb = function(result) {
      // console.log(result);
    };

    $http.post('/rooms/asAudience', {roomname: room}).success(function(result){
      if (result !== '0') {
        $rootScope.details = {'roomname': result.roomname, 'presenter': result.presenter, 'username': result.username};
        $rootScope.message = 'Found the room! Connecting you now.';
        // $rootScope.details = result;
        deferred.resolve(result);
      } else {
        $rootScope.message = 'Room does not exist!';
        deferred.reject(result);
        $location.url('#/main');
      }
    });

    return deferred.promise.catch(function(err) {
        console.error(err);
      }).then(successCb, errorCb, notifyCb);
  };

  return result;

}]);

micServices.factory('Auth', ['$http', '$q','$timeout','$http','$location','$rootScope',
function authFactory($http, $q, $timeout, $http, $location, $rootScope) {
  var result = {};

  result.normalLogin = function(username, password){
    var deferred = $q.defer();

    $http.post('/login', {data: {username: username, password: password}}).success(function(result){
      if (result !== '0') {
        deferred.resolve(result);
      }
      else {
        $rootScope.message = 'Your username does not exist or your password was wrong.';
        deferred.reject();
        $location.url('/');
      }
    });

    return deferred.promise;
  };

  result.signup = function(username, password){
    var deferred = $q.defer();

    $http.post('/signup', {data: {username: username, password: password}}).success(function(result){
      if (result !== '0') {
        deferred.resolve(result);
      }
      else {
        $rootScope.message = 'Username has already been taken.';
        deferred.reject();
        $location.url('/');
      }
    });

    return deferred.promise;
  };

  return result;

}]);