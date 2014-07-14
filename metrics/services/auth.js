var http = require('http');
var restify = require('restify');
var q = require('q');

exports.validate = function(req, res, next) {
    restify.createClient({
        url: 'http://auth:9999',
        headers: { 'x-user': req.headers['x-user'] }
    }).get('/session/' + req.headers['x-session'], function(err, authReq) {
        authReq.on('result', function(err, authRes) {
            if (err || authRes.statusCode > 499) {
                return res.send(500);
            } else if (authRes.statusCode > 299) {
                return res.send(403);
            } else {
                return next();
            }
        });
    });
};