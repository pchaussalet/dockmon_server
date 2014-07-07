var allUsers = require('../allUsers');
var allSessions = require('../allSessions');

exports.initialize = function () {
    var GoogleStrategy = require('passport-google-oauth').OAuth2Strategy;
    return {
            strategy: new GoogleStrategy({
                clientID: '347708899799-7kmlet5hc9bmaauhbpgo5vp3mb7hqso7.apps.googleusercontent.com',
                clientSecret: 'zDctpOFVV2FsdrEpNnNwfwS6',
                callbackURL: 'http://auth.dockmon.io/google/return'
            },
            function (accessToken, refreshToken, profile, done) {
                var email = profile.emails[0].value;
                allUsers.connect(email).then(function(user) {
                    return allSessions.openSession(user.id).then(function(sessionId) {
                        done(null, {
                            user: user.id,
                            session: sessionId
                        });
                    }, function(err) {
                        done(err, null);
                    });
                }, function(err) {
                    done(err, null);
                });
            }
        ),
        options: { scope: 'openid email' }
    };
};