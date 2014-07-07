var http = require('http');
var q = require('q');

exports.validate = function(req, res, next) {
    http.get({
        hostname: 'auth',
        port: 9999,
        path: '/session/' + req.headers['x-session'],
        headers: { 'x-user': req.headers['x-user'] }
    }, function(authRes) {
        if (authRes.statusCode < 300) {
            return next();
        } else if (authRes.statusCode < 500) {
            return res.send(403);
        } else {
            return res.send(500);
        }
    });
};