var allSessions = require('../services/allSessions');

exports.validate = function(req, res, next) {
    var sessionId = req.params.id;
    var userId = req.headers['x-user'];
    if (userId) {
        allSessions.getSession(sessionId, userId).then(function(session) {
            console.log('session', session);
            res.send(204);
            return next();
        }, function(err) {
            console.log('err', err);
            if (err) return next(err);
            res.location('http://www.dockmon.io');
            res.send(302);
            return next();
        });
    } else {
        res.location('http://www.dockmon.io');
        res.send(302);
        return next();
    }
};

exports.open = function(req, res, next) {
    console.log(arguments);
};