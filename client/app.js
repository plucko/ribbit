var micApp = angular.module('micApp', [
  'ngRoute',
  'micControllers',
  'micServices'
]);

micApp.config(['$routeProvider', 
  function($routeProvider) {

    $routeProvider
      .when('/', {
        templateUrl: 'auth/landing.html',
        controller: 'AuthControl'
      })
      .when('/audience', {
        templateUrl: 'audience/audience.html',
        controller: 'AudienceControl'
      })
      .when('/presenter', {
        templateUrl: 'presenter/presenter.html',
        controller: 'PresenterControl'
      })
      .when('/main', {
        templateUrl: 'main/main.html',
        controller: 'MainControl'
      })
      .otherwise({
        redirectTo: '/'
      });
}]);