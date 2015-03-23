var micServices = angular.module('micServices', []);

micServices.factory('Room', ['$http','$location','$rootScope',
function roomFactory($http, $location, $rootScope) {
  var result = {};


  // Code adapted from source found in article
  // https://vickev.com/#!/article/authentication-in-single-page-applications-node-js-passportjs-angularjs
  

  result.tryToMakeRoom = function(room){

    // Make an AJAX call to check if the roomname is in use. If the roomname is available to use,
    // the server will return a non '0' answer. Else, the server sends '0'.

    $http.post('/rooms', {roomname: room}).success(function(result){
      
    // The result argument is the response that the server sends.  
      if (result !== '0') {
        $rootScope.details = {'roomname': result.roomname, 'presenter': result.presenter};
        $rootScope.message = 'Room successfully created!';
        console.log('successful post request to /rooms: About to resolve the promise.');
        $location.url('/presenter');
      }
      // A response of '0' means that the request we made to the server failed and we
      // can respond accordingly. For example, if the roomname "FredsRoom" already exists,
      // the server will send back '0' to mean that the roomname exists, and we should
      // try submitting a different roomname. 
      else {
        $rootScope.message = 'Room already exists.';
        deferred.reject();
        $location.url('/main');
      }
    });

  };

  // Function to check if the user is the presenter for the room. There should
  // only be one presenter bound to each room, and anybody trying to request
  // access to the presenter's view and controller will be turned away if they
  // are not the presenter.

  result.returnPresenter = function($scope, room) {

    $http.post('/rooms/asAudience', {roomname: room}).success(function(result){
      if (result !== '0') {
        console.log('posted to /rooms/asAudience, logging out the result: ', result);
        $rootScope.details = {'roomname': result.roomname, 'presenter': result.presenter, 'username': result.username};
        $rootScope.message = 'Found the room! Connecting you now.';
        console.log('Found room and returning room info (result object)', result);
        $location.url('/audience');
      } else {
        $rootScope.message = 'Room does not exist!';
        console.log('Did not find room, returning room info (result object)', result);
        deferred.reject(result);
        $location.url('/main');
      } 
    })
  };

  return result;

}]);

micServices.factory('Auth', ['$http','$location','$rootScope',
function authFactory($http, $location, $rootScope) {
  var result = {};

  result.normalLogin = function(username, password){

    $http.post('/login', {data: {username: username, password: password}}).success(function(result){
      if (result !== '0') {
        console.log('result !== 0', result);
        deferred.resolve(result);
      }
      else {
        $rootScope.message = 'Your username does not exist or your password was wrong.';
        deferred.reject();
        $location.url('/');
      }
    });

  };

  result.signup = function(username, password){

    $http.post('/signup', {data: {username: username, password: password}}).success(function(result){
      if (result !== '0') {
        console.log('result !== 0', result);
        deferred.resolve(result);
      }
      else {
        $rootScope.message = 'Username has already been taken.';
        deferred.reject();
        $location.url('/');
      }
    });

  };



    //   .get('/auth', {headers: {'Access-Control-Allow-Origin': 'http://127.0.0.1:8000/' }}).success(function(result){
    //   if (result !== '0')
    //     deferred.resolve(result);
    //   else {
    //     $rootScope.message = 'gitLogin failed, don\'t know why.';
    //     deferred.reject();
    //     $location.url('/');
    //   }
    // });


  return result;

}]);