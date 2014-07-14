var restify = require('restify');
var bunyan = require('bunyan');
var minimist = require('minimist');

var auth = require('./services/auth');

var collector = require('./routes/collector');
var container = require('./routes/container');

const DEFAULT_PORT = 9999;

restify.defaultResponseHeaders = function(data) {
    this.header('Server', app.name+'/'+app.version);
};

var app = function() {
    var package_json = require('./package.json');
    return { name: package_json.name, version: package_json.version }
}();

var logger = bunyan.createLogger({
    name: app.name
});

var server = restify.createServer({
    name: app.name,
    log: logger
});

server.use(restify.gzipResponse());
server.use(restify.bodyParser());
server.use(restify.queryParser());

server.use(restify.CORS());
server.on('MethodNotAllowed', function(req, res, next) {
    if (req.method.toLowerCase() === 'options') {
        var allowHeaders = ['Accept', 'Accept-Version', 'Content-Type', 'Api-Version', 'x-user', 'x-session'];

        if (res.methods.indexOf('OPTIONS') === -1) res.methods.push('OPTIONS');

        res.header('Access-Control-Allow-Credentials', true);
        res.header('Access-Control-Allow-Headers', allowHeaders.join(', '));
        res.header('Access-Control-Allow-Methods', res.methods.join(', '));
        res.header('Access-Control-Allow-Origin', req.headers.origin);

        res.send(204);
        return next(false);
    }
    else {
        res.send(new restify.MethodNotAllowedError());
        return next(false);
    }
});

server.post("/server/:id", collector.collect);

server.get("/container/:id/metrics", auth.validate, container.metrics);
server.get("/container/:id/statics", auth.validate, container.statics);
server.get("/container", auth.validate, container.list);

server.on('after', restify.auditLogger({
    log: bunyan.createLogger({
        name: 'audit',
        stream: process.stdout
    })
}));

var argv = minimist(process.argv.slice(2));
var port = argv.port || argv.p || DEFAULT_PORT;

server.listen(+port, function() {
    console.log('Listening on port ' + port);
});