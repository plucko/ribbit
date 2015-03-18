var micApp = angular.module('micApp', [
  'ngRoute',
  'micControllers',
  'micServices'
]);

micApp.config(['$routeProvider', 
  function($routeProvider) {

    // Taken from source code found in article
    // https://vickev.com/#!/article/authentication-in-single-page-applications-node-js-passportjs-angularjs
    
    // Function to check if the user is logged in

    var checkRoomExists = function($q, $timeout, $http, $location, $rootScope){
      // Initialize a new promise
      var deferred = $q.defer();

      // Make an AJAX call to check if the user is logged in
      $http.get('/roomCheck/testRoom').success(function(user){
        // Authenticated
        
        // Interacts with server code because server will be written something like
        // app.get('/loggedin', function(req, res) {
        // res.send(req.isAuthenticated() ? req.user : '0'); }); 
        if (user !== '0')

          /*$timeout(deferred.resolve, 0);*/
          deferred.resolve();

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

    var checkIfPresenter = function($q, $timeout, $http, $location, $rootScope) {
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
          deferred.resolve();

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



    $routeProvider
      // .when('/login', {
      //   templateUrl: 'login.html',
      //   controller: 'LoginControl'
      // })
      .when('/audience', {
        templateUrl: 'audience/audience.html',
        controller: 'AudienceControl',
        resolve: {
          roomCheck: checkRoomExists
        }
      })
      .when('/presenter', {
        templateUrl: 'presenter/presenter.html',
        controller: 'PresenterControl'
        // resolve: {
        //   presenterCheck: checkIfPresenter
        // }
      })
      .when('/main', {
        templateUrl: 'main/main.html',
        controller: 'MainControl'
      })
      .otherwise({
        redirectTo: '/main'
      });
}]);