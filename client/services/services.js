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

    // Make an AJAX call to check if the user is logged in
    $http.post('/rooms', {roomname: room}).success(function(result){
      // Authenticated
      
      // Interacts with server code because server will be written something like
      // app.get('/loggedin', function(req, res) {
      // res.send(req.isAuthenticated() ? req.user : '0'); }); 
      if (result !== '0') {

        /*$timeout(deferred.resolve, 0);*/
        $rootScope.message = 'Room successfully created!';
        console.log('successful post request to /rooms: About to resolve the promise.')
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

    return deferred.promise;
  };

  // Function to check if the user is the presenter for the room. There should
  // only be one presenter bound to each room, and anybody trying to request
  // access to the presenter's view and controller will be turned away if they
  // are not the presenter.

  result.returnPresenter = function() {
    var deferred = $q.defer();

    $http.get('/rooms').success(function(result){
      if (result !== '0') {
        $rootScope.message = 'Found the room! Connecting you now.';
        console.log('Found room and returning room info (result object)', result);
        deferred.resolve(result);
      } else {
        $rootScope.message = 'Room does not exist!';
        console.log('Did not find room, returning room info (result object)', result);
        deferred.reject(result);
        $location.url('#/main');
      }
    });

    return deferred.promise;
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
        console.log('result !== 0', result);
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
        console.log('result !== 0', result);
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



  result.gitLogin = function() {
    var deferred = $q.defer();

    var req = {
     method: 'GET',
     url: '/auth/github',
     headers: {
       'Access-Control-Allow-Origin': '*'
     }
    };

    console.log('about to send get request to /auth in server');

    $http(req).success(function(result) {
      $deferred.resolve(result);
    }).error(function(err) {
      console.error(err);
    });

    //   .get('/auth', {headers: {'Access-Control-Allow-Origin': 'http://127.0.0.1:8000/' }}).success(function(result){
    //   if (result !== '0')
    //     deferred.resolve(result);
    //   else {
    //     $rootScope.message = 'gitLogin failed, don\'t know why.';
    //     deferred.reject();
    //     $location.url('/');
    //   }
    // });

    return deferred.promise;
  };

  return result;

}]);