var micServices = angular.module('micServices', []);

micServices.factory('Room', ['$http','$location','$rootScope',
function roomFactory($http, $location, $rootScope) {
  var result = {};

  // Code adapted from source found in article
  // https://vickev.com/#!/article/authentication-in-single-page-applications-node-js-passportjs-angularjs

  // This function will be invoked when a presenter has submitted the name
  // for the room that he wishes to create.
  result.tryToMakeRoom = function(room){

    // Make an AJAX call to check if the roomname is in use. If the roomname is available to use,
    // the server will return a non '0' answer. Else, the server sends '0'.

    $http.post('/rooms', {roomname: room}).success(function(result){
      
      if (result !== '0') {
        // Stored information in $rootScope as a band-aid solution for sharing information
        // across controllers. It'd be worth investigating how to use the 'Room' service
        // to hold onto the information.
        $rootScope.details = {'roomname': result.roomname, 'presenter': result.presenter};
        $rootScope.message = 'Room successfully created!';
        // Redirects the browser through Angular's routeProvider.
        $location.url('/presenter');
      }
      // A response of '0' means that the roomname, 'FredsRoom', already exists,
      // and we display a message to the user to let him know that he should try to
      // create a room with a different name.
      else {
        $rootScope.message = 'Room already exists.';
        $location.url('/main');
      }
    });

  };

  // This function is invoked when an audience member has submitted the name
  // of a room that he would like to join. If the room exists, the server will
  // respond by sending back an object with the roomname, the presenter for the room,
  // and the name of the user who made the request to join the room.
  // The name of the user who made the request will be used later by the RTC
  // code to let the presenter know who it is that wants to connect to the presenter.

  result.returnPresenter = function($scope, room) {

    $http.post('/rooms/asAudience', {roomname: room}).success(function(result){
      if (result !== '0') {
        // console.log('posted to /rooms/asAudience, logging out the result: ', result);
        $rootScope.details = {'roomname': result.roomname, 'presenter': result.presenter, 'username': result.username};
        $rootScope.message = 'Found the room! Connecting you now.';
        // console.log('Found room and returning room info (result object)', result);
        $location.url('/audience');
      } else {
        $rootScope.message = 'Room does not exist!';
        console.log('Did not find room, returning room info (result object)', result);
        $location.url('/main');
      } 
    })
  };

  return result;

}]);

micServices.factory('Auth', ['$http','$location','$rootScope',
function authFactory($http, $location, $rootScope) {
  var result = {};

  // Not yet complete. We used MongoDb for the database, with
  // Mongoose as our ORM.
  result.normalLogin = function(username, password){

    $http.post('/login', {data: {username: username, password: password}}).success(function(result){
      if (result !== '0') {
        console.log('result !== 0', result);
      }
      else {
        $rootScope.message = 'Your username does not exist or your password was wrong.';
        $location.url('/');
      }
    });

  };

  // Not yet complete. We used MongoDb for the database, with
  // Mongoose as our ORM.
  result.signup = function(username, password){

    $http.post('/signup', {data: {username: username, password: password}}).success(function(result){
      if (result !== '0') {
        console.log('result !== 0', result);
      }
      else {
        $rootScope.message = 'Username has already been taken.';
        $location.url('/');
      }
    });

  };


  return result;

}]);