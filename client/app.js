var micApp = angular.module('micApp', [
  'ngRoute',
  'micControllers'
]);

micApp.config(['$routeProvider', 
  function($routeProvider) {
    $routeProvider
      .when('/index', {
        templateUrl: 'index.html',
        controller: 'IndexControl'
      })
      .when('/joinRoom', {
        templateUrl: 'audience/audience.html',
        controller: 'AudienceControl'
      })
      .when('/createRoom', {
        templateUrl: 'presenter/presenter.html',
        controller: 'PresenterControl'
      })
      .otherwise({
        redirectTo: '/index'
      });
}]);