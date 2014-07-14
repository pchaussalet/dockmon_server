const HOURS = 3600 * 1000;
angular.module('dockmon.controllers')
    .controller('ContainerMetricsCtrl', ['$scope', '$routeParams', '$http', '$location', '$interval', '$filter', 'authService', function ($scope, $routeParams, $http, $location, $interval, $filter, authService) {
        const REFRESH_INTERVAL = 15;

        function parseSinceString(since) {
            var result = -1;
            if (since) {
                var suffix = since.substr(since.length - 1);
                var now = new Date().getTime();
                var unit = MILLISECONDS = 1;
                var SECONDS = 1000 * MILLISECONDS;
                var MINUTES = 60 * SECONDS;
                var HOURS = 60 * MINUTES;
                var DAYS = 24 * HOURS;
                var WEEKS = 7 * DAYS;
                var lastChar = -1;
                switch (suffix) {
                    case 's':
                        unit = SECONDS;
                        break;
                    case 'm':
                        unit = MINUTES;
                        break;
                    case 'h':
                        unit = HOURS;
                        break;
                    case 'd':
                        unit = DAYS;
                        break;
                    case 'w':
                        unit = WEEKS;
                        break;
                    default:
                        unit = MILLISECONDS;
                        lastChar = 0;
                        break;
                }
                result = now - (parseInt(since.slice(0, lastChar)) * unit);
            }

            return  result;
        }

        $scope.gatherMetrics = function() {
            var since = $scope.since > 0 ? '?since=' + $scope.since : '';

            $http.get('http://metrics.dockmon.io/container/' + $scope.id + '/metrics' + since)
                .success(function (states) {
                    if (!states) {
                        return;
                    }
                    var cpuMetrics = $scope.cpuMetrics.slice(0).map(function(serie) { return {key: serie.key, values: []} });
                    var memoryMetrics = $scope.memoryMetrics.slice(0).map(function(serie) { return {key: serie.key, values: []} });
                    var networkMetrics = $scope.networkMetrics.slice(0).map(function(serie) { return {key: serie.key, values: []} });
                    angular.forEach(states, function(state) {
                        cpuMetrics[0].values.push([state.x, state.cpu.user]);
                        cpuMetrics[1].values.push([state.x, state.cpu.system]);

                        memoryMetrics[0].values.push([state.x, state.memory.rss]);
                        memoryMetrics[1].values.push([state.x, state.memory.cache]);
                        memoryMetrics[2].values.push([state.x, state.memory.swap]);

                        networkMetrics[0].values.push([state.x, state.network.txOk])
                        networkMetrics[1].values.push([state.x, state.network.rxOk])
                    });
                    var cleanValues = function(serie) {
                        serie.values.sort();
                        var lastTime = 0;
                        var values = [];
                        angular.forEach(serie.values, function(value) {
                            if (value[0] != lastTime) {
                                value[0] += offset;
                                values.push(value);
                                lastTime = value[0];
                            }
                        });
                        serie.values = values;
                        offset++;
                    };
                    var aggregateValues = function(serie) {
                        var values = [];
                        for (var i = 1; i < serie.values.length; i++) {
                            var currVal = serie.values[i];
                            var prevVal = serie.values[i-1];
                            var metricValue = (currVal[1] - prevVal[1])/(currVal[0]-prevVal[0]);
                            values.push([currVal[0], metricValue || 0]);
                        }
                        serie.values = values;
                    };
                    var offset = 0;
                    angular.forEach(cpuMetrics, cleanValues);
                    angular.forEach(cpuMetrics, aggregateValues);
                    offset = 0;
                    angular.forEach(memoryMetrics, cleanValues);
                    offset = 0;
                    angular.forEach(networkMetrics, cleanValues);
                    angular.forEach(networkMetrics, aggregateValues);
                    $scope.cpuMetrics = cpuMetrics;
                    $scope.memoryMetrics = memoryMetrics;
                    $scope.networkMetrics = networkMetrics;
                });
            $scope.lastUpdate = new Date();
        };

        $scope.getTime = function() {
            return function(d) {
                return $filter('date')(d, 'yyyy-MM-dd HH:mm:ss Z');
            };
        };

        $scope.getPerSecond = function() {
            return function(d) {
                return d[1] * 1000;
            };
        };

        $scope.gatherStatics = function() {
            $http.get('http://metrics.dockmon.io/container/' + $scope.id + '/statics')
                .success(function(data) {
                    $scope.statics = data.Info;
                    // TODO : Until ports display is correctly handled
                    delete $scope.statics.Ports;
                    // TODO : Until image is correctly handled by name
                    delete $scope.statics.Image;
                });
        };

        $scope.initialize = function(id) {
            $scope.id = id;
            $scope.since = parseSinceString(($location.search()).since);
            $scope.duration = $scope.since != -1 ? new Date().getTime() - $scope.since : 24*HOURS;
            $scope.yesterday = new Date().getTime() - (24 * HOURS);

            $scope.cpuMetrics = [
                { key: 'User',      values: [] },
                { key: 'System',    values: [] }
            ];

            $scope.memoryMetrics = [
                { key: 'RSS',   values: [] },
                { key: 'Cache', values: [] },
                { key: 'Swap',  values: [] }
            ];

            $scope.networkMetrics = [
                { key: 'Tx',    values: [] },
                { key: 'Rx',    values: [] }
            ]

            $scope.gatherMetrics();
            $scope.gatherStatics();
            var promiseMetrics = $interval($scope.gatherMetrics, REFRESH_INTERVAL * 1000)
            $scope.$on('$destroy', function() { $interval.cancel(promiseMetrics); });
        };

        $scope.initialize($routeParams.id);
    }]);
