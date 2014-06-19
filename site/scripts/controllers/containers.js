angular.module('dockmon.controllers')
    .controller('ContainersCtrl', ['$scope', '$http', function ($scope, $http) {
        $scope.initialize = function() {
            $http.get('/container')
                .success(function(data, status) {
                    var timestamps = data.map(function(x) { return x.lastSeen; });
                    var lastTimestamp = 0;
                    timestamps.forEach(function(timestamp) {
                        lastTimestamp = Math.max(lastTimestamp, timestamp);
                    });
                    var upToDate = [];
                    var outdated = [];
                    data.forEach(function(container) {
                        if (Math.round(container.lastSeen/1000) < Math.round(lastTimestamp/1000)) {
                            outdated.push(container);
                        } else {
                            upToDate.push(container);
                        }
                    });
                    $scope.upToDate = upToDate;
                    $scope.outdated = outdated;
                });
        };

        $scope.initialize();
    }]);
