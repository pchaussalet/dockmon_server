var restify = require('restify');
var bunyan = require('bunyan');
var minimist = require('minimist');

require('./lib/response');

var authProvider = require('./services/authProvider');

var session = require('./routes/session');

const DEFAULT_PORT = 9999;

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
server.use(restify.queryParser());
server.use(restify.bodyParser());

server.use(restify.CORS());
server.on('MethodNotAllowed', function(req, res) {
    if (req.method.toLowerCase() === 'options') {
        var allowHeaders = ['Accept', 'Accept-Version', 'Content-Type', 'Api-Version', 'x-user', 'x-session'];

        if (res.methods.indexOf('OPTIONS') === -1) res.methods.push('OPTIONS');

        res.header('Access-Control-Allow-Credentials', true);
        res.header('Access-Control-Allow-Headers', allowHeaders.join(', '));
        res.header('Access-Control-Allow-Methods', res.methods.join(', '));
        res.header('Access-Control-Allow-Origin', req.headers.origin);

        return res.send(204);
    }
    else
        return res.send(new restify.MethodNotAllowedError());
});

server.on('after', restify.auditLogger({
    log: bunyan.createLogger({
        name: 'audit',
        stream: process.stdout
    })
}));

authProvider.initialize(server);

server.post('/session', session.open);
server.get('/session/:id', session.validate);

var argv = minimist(process.argv.slice(2));
var port = argv.port || argv.p || DEFAULT_PORT;

server.listen(+port, function() {
    console.log('Listening on port ' + port);
});