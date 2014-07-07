var google = require('./stategies/google');

exports.initialize = function(server) {
    var auth = {
        google: {
            login:      '/google',
            callback :  '/google/return',
            config:     google.initialize()
/*
             },
             github: {
             login:      '/github',
             callback :  '/github/return'
             },
             linkedin: {
             login:      '/linkedin',
             callback :  '/linkedin/return'
*/
        }
    };

    var passport = require('passport');

    server.use(passport.initialize());
    server.use(passport.session());

    var providers = Object.keys(auth);
    providers.forEach(function(id) {
        var provider = auth[id];
        passport.use(provider.config.strategy);

        server.get(provider.login, passport.authenticate(id, provider.config.options));

        server.get(provider.callback,
            passport.authenticate(id, { failureRedirect: '/' }),
            function(req, res, next) {
                var session = new Buffer(req.user.user + ':' + req.user.session).toString('base64');
                res.cookie('session', session + '; Domain=.dockmon.io; Path=/');
                res.location('http://dash.dockmon.io/');
                res.send(302);
                return next();
            }
        );
    });

    passport.serializeUser(function(user, done) {
        done(null, user);
    });

    passport.deserializeUser(function(user, done) {
        done(null, user);
    });
};
