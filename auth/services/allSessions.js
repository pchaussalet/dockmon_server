var q = require('q');
var redis = require('then-redis');
var uuid = require('uuid-v4');

const SESSION_DURATION = 600;

var db = null;
var options = {
    host: 'redis',
    port: 6379,
    database: 0
};
var backup = {
    everySecs: 60,
    everyWrites: 1000
};
redis.connect(options).then(function(conn) {
    db = conn;
    db.save(backup.everySecs, backup.everyWrites);
}, function(err) {
    console.log(err);
});

exports.openSession = function(userId) {
    var deferred = q.defer();
    var sessionId = uuid();
    db.setex(sessionId, SESSION_DURATION, userId).then(function() {
        deferred.resolve(sessionId);
    }, function(err) {
        deferred.reject(err);
    });
    return deferred.promise;
};

exports.getSession = function(id, userId) {
    var deferred = q.defer();
    db.get(id).then(function(redisUserId) {
        if (userId == redisUserId) {
            deferred.resolve();
            db.expire(redisUserId, SESSION_DURATION);
        } else {
            deferred.reject();
        }
    }, function(err) {
        deferred.reject(err);
    });
    return deferred.promise;
};