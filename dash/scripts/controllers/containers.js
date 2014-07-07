angular.module('dockmon.controllers')
    .controller('ContainersCtrl', ['$scope', '$http', 'authService', function ($scope, $http, authService) {
        $scope.initialize = function() {
            authService.initSession().then(function() {
                $http.get('http://metrics.dockmon.io/container')
                    .success(function(data) {
                        var timestamps = data.map(function(x) { return x.lastSeen; });
                        var lastTimestamp = 0;
                        timestamps.forEach(function(timestamp) {
                            lastTimestamp = Math.max(lastTimestamp, timestamp);
                        });
                        var upToDate = [];
                        var outdated = [];
                        data.forEach(function(container) {
                            if (Math.round(container.lastSeen/1000) < Math.round(lastTimestamp/1000) || container.running == 'false') {
                                outdated.push(container);
                            } else {
                                upToDate.push(container);
                            }
                        });
                        $scope.upToDate = upToDate;
                        $scope.outdated = outdated;
                    });
            }, authService.redirectToLogin);
        };

        $scope.initialize();
    }]);
