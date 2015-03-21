var micApp = angular.module('micApp', [
  'ngRoute',
  'micControllers',
  'micServices'
]);

micApp.config(['$routeProvider', '$httpProvider', 
  function($routeProvider, $httpProvider) {


    $httpProvider.interceptors.push(function($q, $location) {
      return {
        response: function(response) {
          console.log('successful interception', response);
          return response;
        },
        responseError: function(response) {
          if (response.status === 401)
            $location.url('/');
          return $q.reject(response);
        }
      };
    });


    var checkLoggedin = function($q, $timeout, $http, $location, $rootScope) {
      var deferred = $q.defer();

      $http.get('/loggedin').success(function(user){
        if (user !== '0') {
          console.log('logged in', user);
          deferred.resolve();
        } else { 
          $rootScope.message = 'You need to log in.';
          console.log('you are not logged in', user);
          deferred.reject(); 
          $location.url('/login');
        } 
      });

      return deferred.promise;

    };


    $routeProvider
      .when('/', {
        templateUrl: 'auth/landing.html',
        controller: 'AuthControl'
      })
      .when('/audience', {
        templateUrl: 'audience/audience.html',
        controller: 'AudienceControl',
        resolve: {
          loggedin: checkLoggedin
        }
      })
      .when('/presenter', {
        templateUrl: 'presenter/presenter.html',
        controller: 'PresenterControl',
        resolve: {
          loggedin: checkLoggedin
        }
      })
      .when('/main', {
        templateUrl: 'main/main.html',
        controller: 'MainControl',
        resolve: {
          loggedin: checkLoggedin
        }
      })
      .otherwise({
        redirectTo: '/'
      });
    }]);
