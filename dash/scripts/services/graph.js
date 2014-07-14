angular.module('dockmon.services').factory('graphService', function() {
    return {
        getGraphData: function(states, cpuMetrics, memoryMetrics, networkMetrics) {
            angular.forEach(states, function (state) {
                cpuMetrics[0].values.push([state.x, state.cpu.user]);
                cpuMetrics[1].values.push([state.x, state.cpu.system]);

                memoryMetrics[0].values.push([state.x, state.memory.rss]);
                memoryMetrics[1].values.push([state.x, state.memory.cache]);
                memoryMetrics[2].values.push([state.x, state.memory.swap]);

                networkMetrics[0].values.push([state.x, state.network.txOk])
                networkMetrics[1].values.push([state.x, state.network.rxOk])
            });
            var cleanValues = function (serie) {
                serie.values.sort();
                var lastTime = 0;
                var values = [];
                angular.forEach(serie.values, function (value) {
                    if (value[0] != lastTime) {
                        value[0] += offset;
                        values.push(value);
                        lastTime = value[0];
                    }
                });
                serie.values = values;
                offset++;
            };
            var aggregateValues = function (serie) {
                var values = [];
                for (var i = 1; i < serie.values.length; i++) {
                    var currVal = serie.values[i];
                    var prevVal = serie.values[i - 1];
                    var metricValue = (currVal[1] - prevVal[1]) / (currVal[0] - prevVal[0]);
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
        }
    };
});
