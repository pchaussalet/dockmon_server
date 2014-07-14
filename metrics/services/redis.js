var q = require('q');
var redis = require('then-redis');
var flat = require('flat');

var connections = [];

var options = {
    host: 'redis',
    port: 6379,
    database: 1
};

var db;
var backup = {
    everySecs: 60,
    everyWrites: 1000
};
redis.connect(options).then(function(conn) {
    db = conn;
    db.save(backup.everySecs, backup.everyWrites);
});

exports.saveValues = function(key, values) {
    return db.hmset(key, flat.flatten(values));
};

exports.getValues = function(key) {
    var deferred = q.defer();
    db.hgetall(key).then(function(flatValue) {
        deferred.resolve(flat.unflatten(flatValue));
    }, function(err) {
        deferred.reject(err);
    });
    return deferred.promise;
};

exports.listContainers = function(userId) {
    var deferred = q.defer();
    db.keys('container:'+ userId + ':*').then(function(keys) {
        var containers = [];
        var containersCount = keys.length;
        if (containersCount > 0) {
            keys.forEach(function(key) {
                db.hmget(key, 'Info.Name', 'date', 'Info.Running').then(function(data) {
                    containers.push({
                        id: key.split(':')[2],
                        name: data[0],
                        lastSeen: data[1],
                        running: data[2]
                    });
                    if (--containersCount == 0) {
                        deferred.resolve(containers);
                    }
                }, function(err) {
                    deferred.reject(err);
                });
            });
        } else {
            deferred.resolve();
        }
    }, function(err) {
        deferred.reject(err);
    });
    return deferred.promise;
};

