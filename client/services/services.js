var micServices = angular.module('micServices', []);

micServices.factory('Room', ['$http', function roomFactory($http) {
  var result = {};

  result.newLog = function() {
    console.log('made it to Rooms log function');
  };

  result.joinRoom = function(user) {
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
  };

  return result;

}]);