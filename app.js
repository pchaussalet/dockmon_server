var restify = require('restify');
var bunyan = require('bunyan');

var collector = require('./routes/collector');
var container = require('./routes/container');

var server = restify.createServer({
    name: "DockMon server"
});
server.use(restify.gzipResponse());
server.use(restify.bodyParser());
server.use(restify.queryParser());

server.post("/server/:id", collector.collect);

server.get("/container", container.list);
server.get("/container/:id/metrics", container.metrics);
server.get("/container/:id/statics", container.statics);

server.get(/\/?.*/, restify.serveStatic({
    directory: './site',
    default: 'index.html'
}));

server.on('after', restify.auditLogger({
    log: bunyan.createLogger({
        name: 'audit',
        stream: process.stdout
    })
}));

server.listen(9999);