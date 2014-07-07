var db = require('./mongodb').db;
var q = require('q');

exports.NOT_FOUND = NOT_FOUND = 404;

db.bind('user').bind({
    modify: function(query, document) {
        var deferred = q.defer();
        this.findAndModify(query, {_id: 1}, document, {new: true, upsert: true}, function(err, user) {
            if (err) deferred.reject(err);
            else deferred.resolve(user);
        });
        return deferred.promise;
    },
    connectUser: function(email) {
        var userId = new Buffer(email).toString('base64');
        return this.modify({email: email, id: userId}, {$set: {lastConnection: new Date().getTime()}});
    }
});

exports.connect = db.user.connectUser;
