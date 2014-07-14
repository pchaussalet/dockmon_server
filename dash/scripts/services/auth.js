angular.module('dockmon.services').factory('authService', ['$http', '$q', '$cookies', '$window', 'base64Service', function($http, $q, $cookies, $window, base64Service) {
    var Session = function(user, id) {
        this.user = user;
        this.id = id;
    };

    var getSessionFromCookie = function() {
        var session = $cookies.session || '';
        var data = base64Service.decode(session).split(':');
        return new Session(data[0],data[1]);
    };

    var validateSession = function(session) {
        return $http.get('http://auth.dockmon.io/session/'+session.id, { headers: {'x-user': session.user }});
    };

    var session = null;
    return {
        NO_SESSION: 401,
        INVALID_SESSION: 403,
        initSession: function() {
            var deferred = $q.defer();
            var _session = session || getSessionFromCookie();
            if (!_session) {
                deferred.reject(this.NO_SESSION)
            } else {
                validateSession(_session).then(function() {
                    $http.defaults.headers.common['x-user'] = _session.user;
                    $http.defaults.headers.common['x-session'] = _session.id;
                    session = _session;
                    deferred.resolve();
                }, function() {
                    deferred.reject(this.INVALID_SESSION);
                });
            }
            return deferred.promise;
        },
        redirectToLogin: function(cause) {
            $window.location.href = 'http://www.dockmon.io';
        },
        getUser: function() {
            return session.user;
        }
    };
}]);
