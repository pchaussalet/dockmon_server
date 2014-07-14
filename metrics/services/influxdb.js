var q = require('q');
var async = require('async');
var influx = require('influx');

var client = influx({
    host: 'influxdb',
    port: 8086,
    username : 'root',
    password : 'root',
    database : 'dockmon'
});

exports.saveValues = function(key, values) {
    var deferred = q.defer();
    client.writePoints(key, values, function(err) {
        if (err) {
            deferred.reject(err);
        } else {
            deferred.resolve(arguments);
        }
    });
    return deferred.promise;
};

exports.saveSeries = function(series) {
    var deferred = q.defer();
    var keys = Object.keys(series);
    var finished = 0;
    var i = 0;
    async.whilst(
        function() { return finished < keys.length },
        function(callback) {
            var key = keys[i];
            exports.saveValues(key, series[key]).then(function() {
                finished++;
                callback();
            }, function(err) {
                finished++;
                callback(err);
            });
            i++;
        },
        function(err) {
            if (err) {
                deferred.reject(err);
            } else {
                deferred.resolve();
            }
        }
    );
    return deferred.promise;
};

exports.getContainerData = function(userId, containerId, since) {
    const EXCLUDED_COL = ['sequence_number', 'container', 'host'];
    var deferred = q.defer();
    var query = "SELECT * FROM /.*/ group by (1s) where userId = '" + userId + "' and container = '" + containerId + "' and time > " + since * 1000000;
    client.query(query, function(err, series) {
        if (err) deferred.reject(err);
        var points = {};
        for (var i = 0; i < series.length; i++) {
            var serie = series[i];
            for (var j = 0; j < serie.points.length; j++) {
                var point = serie.points[j];
                var time = 0;
                for (var k = 0; k < point.length; k++) {
                    var key = serie.columns[k];
                    if (EXCLUDED_COL.indexOf(key) == -1) {
                        if (key == 'time') {
                            time = point[k];
                            if (!points.hasOwnProperty(time)) {
                                if (points.hasOwnProperty(0)) {
                                    points[time] = points[0];
                                    delete points[0];
                                } else {
                                    points[time] = {x: time};
                                }
                            }
                        } else {
                            if (!points[time].hasOwnProperty([serie.name.replace(/_series$/, '')])) {
                                points[time][serie.name.replace(/_series$/, '')] = {};
                            }
                            points[time][serie.name.replace(/_series$/, '')][key] = point[k];
                        }
                    }
                }
            }
        }
        delete points[since];
        var keys = Object.keys(points);
        var results = [];
        keys.sort().forEach(function(key) {
            results.push(points[key]);
        });
        deferred.resolve(results);
    });
    return deferred.promise;
};

exports.getContainers = function() {
    var deferred = q.defer();
    var query = 'select time, container from /.*/';
    client.query(query, function(err, series) {
        if (err) deferred.reject(err);
        var lastSeen = {};
        for (var i = 0; i < series.length; i++) {
            var serie = series[i];
            var container = {};
            for (var j = 0; j < serie.points.length; j++) {
                var id = serie.points[j][2];
                if (!lastSeen.hasOwnProperty(id)) {
                    lastSeen[id] = serie.points[j][0];
                } else {
                    lastSeen[id] = Math.max(lastSeen[id], serie.points[j][0]);
                }
            }
        }

        var result = [];
        var ids = Object.keys(lastSeen);
        for (var i = 0; i < ids.length; i++) {
            var id = ids[i];
            result.push({
                id: id,
                lastSeen: lastSeen[id]
            });
        }
        deferred.resolve(result);
    });
    return deferred.promise;
};

function getDateTimeString(timestamp) {
    var date = new Date(+timestamp);
    var dateString = [
        date.getFullYear(),
        ('00' + (date.getUTCMonth() + 1)).slice(-2),
        ('00' + date.getUTCDate()).slice(-2)
    ].join('-');
    var timeString = [
        date.toUTCString().split(' ')[4],
        ('000' + date.getUTCMilliseconds()).slice(-3)
    ].join('.');
    return [
        dateString,
        timeString
    ].join(' ');
}