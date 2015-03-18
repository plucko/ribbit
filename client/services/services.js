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
    $http.post('/roomCheck', {data: {room: room}}).success(function(user){
      // Authenticated
      
      // Interacts with server code because server will be written something like
      // app.get('/loggedin', function(req, res) {
      // res.send(req.isAuthenticated() ? req.user : '0'); }); 
      if (user !== '0')

        /*$timeout(deferred.resolve, 0);*/
        deferred.resolve(user);

      // Not Authenticated
      else {
        $rootScope.message = 'Room does not exist or you entered the password incorrectly. Try again.';
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
    // Initialize a new promise
    var deferred = $q.defer();

    // Make an AJAX call to check if the user is logged in
    $http.get('/isPresenter').success(function(user){
      // Authenticated
      
      // Interacts with server code because server will be written something like
      // app.get('/loggedin', function(req, res) {
      // res.send(req.isAuthenticated() ? req.user : '0'); }); 
      if (user !== '0')

        /*$timeout(deferred.resolve, 0);*/
        deferred.resolve(user);

      // Not Authenticated
      else {
        $rootScope.message = 'You are not the presenter for this room.';
        //$timeout(function(){deferred.reject();}, 0);
        deferred.reject();
        $location.url('/main');
      }
    });

    return deferred.promise;
  };


  // result.newLog = function() {
  //   console.log('made it to Rooms log function');
  // };

  // result.joinRoom = function(user) {
    // console.log('made it to Room services joinroom');
    // $http({
    //   url: '127.0.0.1:8000/joinRoom',
    //   method: 'POST',
    //   data: JSON.stringify(user)
    //   })
    // .success(function(data, status, headers, config) {
    //   return data;
    // })
    // .error(function(data, status, headers, config) {
    //   return data;
    // });

  return result;

}]);