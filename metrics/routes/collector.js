var influxdb = require('../services/influxdb');
var redis = require('../services/redis');

exports.collect = function(req, res, next) {
    try {
        var userId = req.headers['x-user'];
        delete req.params.id;
        var date = new Date();
        var series = {
            cpu_series: [],
            memory_series: [],
            network_series: [],
            status_series: []
        };

        var currentDate = new Date().getTime();
        Object.keys(req.body).forEach(function(containerId) {
            var data = req.body[containerId];
            getPointsForContainer(userId, req.params.id, containerId, data, date, series);
            data.date = currentDate;
            redis.saveValues(['container', userId,  containerId].join(':'), data);
        });

        influxdb.saveSeries(series).then(function() {
            res.send(201);
            return next()
        }, function(err) {
            return next(err);
        });
    } catch (err) {
        next(err);
    }
};

function getPointsForContainer(userId, hostId, containerId, containerData, date, series) {
    if (containerData.Info.Running) {
        series.cpu_series.push(getCpuPointForContainer(userId, hostId, containerId, containerData, date));
        series.memory_series.push(getMemoryPointForContainer(userId, hostId, containerId, containerData, date));
        series.network_series.push(getNetworkPointForContainer(userId, hostId, containerId, containerData, date));
        series.status_series.push(getStatusPointForContainer(userId, hostId, containerId, containerData, date));
    }
}

function getCpuPointForContainer(userId, hostId, containerId, containerData, date) {
    var data = containerData.Cpu;
    return {
        time: date,
        userId: userId,
        container: containerId,
        host: hostId,
        user: data.User,
        system: data.System
    };
}

function getMemoryPointForContainer(userId, hostId, containerId, containerData, date) {
    var data = containerData.Memory;
    return {
        time: date,
        userId: userId,
        container: containerId,
        host: hostId,
        rss: data.Rss,
        cache: data.Cache,
        total: data.Total,
        swap: data.Swap
    };
}

function getNetworkPointForContainer(userId, hostId, containerId, containerData, date) {
    var data = containerData.Network;
    return {
        time: date,
        userId: userId,
        container: containerId,
        host: hostId,
        rxOk: data.RxOk,
        rxErr: data.RxErr,
        txOk: data.TxOk,
        txErr: data.TxErr
    };
}

function getStatusPointForContainer(userId, hostId, containerId, containerData, date) {
    var data = containerData.Info;
    return {
        time: date,
        userId: userId,
        container: containerId,
        host: hostId,
        state: data.Running
    };
}
