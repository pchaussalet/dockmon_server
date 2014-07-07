var influxdb = require('../services/influxdb');
var redis = require('../services/redis');

exports.metrics = function(req, res, next) {
    var containerId = req.headers['x-user'] + ':' + req.params.id;
    var YESTERDAY = new Date().setDate(new Date().getDate() - 1);
    var since = +req.params.since || YESTERDAY;
    influxdb.getContainerData(containerId, since).then(function(data) {
        if (Object.keys(data).length != 0) {
            res.send(data);
        } else {
            res.send(204);
        }
    }, function(err) {
        res.send(500, err);
    }).finally(function() {
        next();
    });
};

exports.statics = function(req, res, next) {
    var containerId = req.headers['x-user'] + ':' + req.params.id;
    redis.getValues('container:' + containerId).then(function(values) {
        if (values) {
            res.send(values);
        } else {
            res.send(204);
        }
    }, function(err) {
        res.send(500, err);
    }).finally(function() {
        next();
    });
};

exports.list = function(req, res, next) {
    redis.listContainers(req.headers['x-user']).then(function(data) {
        if (data) {
            res.send(data);
        } else {
            res.send(204);
        }
        next();
    });
};
