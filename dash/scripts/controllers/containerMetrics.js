const HOURS = 3600 * 1000;
angular.module('dockmon.controllers')
    .controller('ContainerMetricsCtrl', ['$scope', '$routeParams', '$http', '$location', '$interval', function ($scope, $routeParams, $http, $location, $interval) {
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

        function getMetricDiff(metricsArray, newValue) {
            return (metricsArray.length > 0 ? newValue - metricsArray.slice(-1)[0].absValue : newValue);
        }

        $scope.gatherMetrics = function() {
            var since = $scope.since > 0 ? '?since=' + $scope.since : '';

            $http.get('http://metrics.dockmon.io/container/' + $scope.id + '/metrics' + since)
                .success(function (states) {
                    if (states) {
                        $scope.yesterday = new Date().getTime() - (24 * HOURS);
                        var cpuMetrics = {
                            user:   $scope.cpuMetrics[0].data.slice(0),
                            system: $scope.cpuMetrics[1].data.slice(0)
                        };
                        var memoryMetrics = {
                            rss:    $scope.memoryMetrics[0].data.slice(0),
                            cache:  $scope.memoryMetrics[1].data.slice(0),
                            swap:   $scope.memoryMetrics[2].data.slice(0)
                        };
                        var networkOkMetrics = {
                            tx:     $scope.networkOkMetrics[0].data.slice(0),
                            rx:     $scope.networkOkMetrics[1].data.slice(0)
                        };
                        var lastTimestamp = cpuMetrics.user.length > 0 ? cpuMetrics.user.slice(-1)[0].x : -1;
                        var previousTimestamp = lastTimestamp;
                        states.forEach(function(state) {
                            if (state.x > lastTimestamp) {
                                var sampleDuration = (state.x - previousTimestamp) / 1000;
                                var user = getMetricDiff(cpuMetrics.user, state.cpu.user);
                                var system = getMetricDiff(cpuMetrics.system, state.cpu.system);

                                cpuMetrics.user.push({x: state.x ,y: Math.round(user / sampleDuration), absValue: state.cpu.user});
                                cpuMetrics.system.push({x: state.x ,y: Math.round(system / sampleDuration), absValue: state.cpu.system});

                                memoryMetrics.rss.push({x: state.x ,y: state.memory.rss});
                                memoryMetrics.cache.push({x: state.x ,y: state.memory.cache});
                                memoryMetrics.swap.push({x: state.x ,y: state.memory.swap});

                                var tx = getMetricDiff(networkOkMetrics.tx, state.network.txOk);
                                var rx = getMetricDiff(networkOkMetrics.rx, state.network.rxOk);
                                networkOkMetrics.tx.push({x: state.x, y: Math.round(tx / sampleDuration), absValue: state.network.txOk});
                                networkOkMetrics.rx.push({x: state.x, y: Math.round(rx / sampleDuration), absValue: state.network.rxOk});
                                previousTimestamp = state.x;
                            }
                        });
                        var metricComparator = function(a, b) {
                            if (a == b) return 0;
                            return a.x > b.x ? 1 : -1;
                        };
                        cpuMetrics.user.sort(metricComparator);
                        cpuMetrics.system.sort(metricComparator);
                        memoryMetrics.rss.sort(metricComparator);
                        memoryMetrics.cache.sort(metricComparator);
                        memoryMetrics.swap.sort(metricComparator);
                        networkOkMetrics.tx.sort(metricComparator);
                        networkOkMetrics.rx.sort(metricComparator);
                        $scope.cpuFeatures = {
                            legend: { toggle: true, highlight: true },
                            hover: {
                                xFormatter: function(x) { return new Date(x); },
                                yFormatter: function(y) { return + y + '%'; }
                            },
                            palette: 'colorwheel'
                        };
                        $scope.memoryFeatures = {
                            legend: { toggle: true, highlight: true },
                            hover: {
                                xFormatter: function(x) { return new Date(x); },
                                yFormatter: function(y) { return Math.round(+y / (1024 * 1024)) + 'MB'; }
                            },
                            yAxis: { tickFormat: 'formatKMBT' },
                            palette: 'colorwheel'
                        };
                        $scope.networkOkFeatures = {
                            legend: { toggle: true, highlight: true },
                            hover: {
                                xFormatter: function(x) { return new Date(x); },
                                yFormatter: function(y) { return Math.round(+y / (1024)) + 'kB'; }
                            },
                            yAxis: { tickFormat: 'formatKMBT' },
                            palette: 'colorwheel'
                        };

                        $scope.cpuMetrics = [
                            { name: $scope.cpuMetrics[0].name, data: cpuMetrics.user.filter(function(x) { return lastTimestamp - x.x < $scope.duration }) },
                            { name: $scope.cpuMetrics[1].name, data: cpuMetrics.system.filter(function(x) { return lastTimestamp - x.x < $scope.duration }) }
                        ];

                        $scope.memoryMetrics = [
                            { name: $scope.memoryMetrics[0].name, data: memoryMetrics.rss.filter(function(x) { return lastTimestamp - x.x < $scope.duration }) },
                            { name: $scope.memoryMetrics[1].name, data: memoryMetrics.cache.filter(function(x) { return lastTimestamp - x.x < $scope.duration }) },
                            { name: $scope.memoryMetrics[2].name, data: memoryMetrics.swap.filter(function(x) { return lastTimestamp - x.x < $scope.duration }) }
                        ];

                        $scope.networkOkMetrics = [
                            { name: $scope.networkOkMetrics[0].name, data: networkOkMetrics.tx.filter(function(x) { return lastTimestamp - x.x < $scope.duration }) },
                            { name: $scope.networkOkMetrics[0].name, data: networkOkMetrics.rx.filter(function(x) { return lastTimestamp - x.x < $scope.duration }) }
                        ];
                    }
                });
            $scope.lastUpdate = new Date();
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

            $scope.cpuOptions = {
                renderer: 'line',
                interpolation: 'linear'
            };
            $scope.cpuMetrics = [
                { name: 'User', data: [] },
                { name: 'System', data: [] }
            ];

            $scope.memoryOptions = {
                renderer: 'line',
                interpolation: 'linear'
            };
            $scope.memoryMetrics = [
                { name: 'RSS', data: [] },
                { name: 'Cache', data: [] },
                { name: 'Swap', data: [] }
            ];

            $scope.networkOkOptions = {
                renderer: 'line',
                interpolation: 'step-after'
            };
            $scope.networkOkMetrics = [
                { name: 'Tx', data: [] },
                { name: 'Rx', data: [] }
            ];

            $scope.gatherMetrics();
            $scope.gatherStatics();
            var promiseMetrics = $interval($scope.gatherMetrics, REFRESH_INTERVAL * 1000)
            $scope.$on('$destroy', function() { $interval.cancel(promiseMetrics); });
        };

        $scope.initialize($routeParams.id);
    }]);
