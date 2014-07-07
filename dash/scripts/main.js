angular.module('dockmon.controllers', []);
angular.module('dockmon.services', []);

angular.module('dockmon', [ 'ngRoute', 'ngCookies', 'n3-charts.linechart', 'dockmon.controllers', 'dockmon.services', 'angular-rickshaw' ])
.config(['$routeProvider', function ($routeProvider) {
    $routeProvider
        .when('/list', {
            templateUrl: 'views/containers.html',
            controller: 'ContainersCtrl'
        })
        .when('/details/:id', {
            templateUrl: 'views/containerMetrics.html',
            controller: 'ContainerMetricsCtrl'
        })
        .otherwise({
            redirectTo: '/list'
        });
}]);

angular.element(document).ready(function () {
    angular.bootstrap(document, ['dockmon']);
});
