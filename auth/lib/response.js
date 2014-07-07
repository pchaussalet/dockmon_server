var http = require('http');

http.ServerResponse.prototype.location = function(target) {
    this.header('location', target);
};

http.ServerResponse.prototype.cookie = function(key, value) {
    this.header('set-cookie', key+'='+value);
};

