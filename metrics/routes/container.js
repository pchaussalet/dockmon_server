var influxdb = require('../services/influxdb');
var redis = require('../services/redis');

exports.metrics = function(req, res, next) {
    var since = +req.params.since || new Date().setDate(new Date().getDate() - 1);
    influxdb.getContainerData(req.headers['x-user'], req.params.id, since).then(function(data) {
        (Object.keys(data).length != 0) ? res.send(data) : res.send(204);
        return next();
    }, function(err) {
        return next(err);
    });
};

exports.statics = function(req, res, next) {
    var containerId = req.headers['x-user'] + ':' + req.params.id;
    redis.getValues('container:' + containerId).then(function(values) {
        values ? res.send(values) : res.send(204);
        return next();
    }, function(err) {
        return next(err);
    });
};

exports.list = function(req, res, next) {
    redis.listContainers(req.headers['x-user']).then(function(containers) {
        containers ? res.send(containers) : res.send(204);
        return next();
    }, function(err) {
        return next(err);
    });
};
