var mongo = require('mongoskin');
var q = require('q');

exports.db = db = mongo.db('mongodb://mongodb:27017/auth', {native_parser: true});

