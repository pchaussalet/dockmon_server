var influxdb = require('../services/influxdb');
var redis = require('../services/redis');

exports.collect = function(req, res, next) {
    var hostId = req.params.id;
    delete req.params.id;
    var date = new Date();
    var series = {
        cpu_series: [],
        memory_series: [],
        network_series: [],
        status_series: []
    };

    Object.keys(req.params).forEach(function(id) {
        var data = req.body[id];
        getPointsForContainer(id, data, hostId, date, series);
        data.date = new Date().getTime();
        redis.saveValues('container:' + id, data);
    });

    influxdb.saveSeries(series).then(function() {
        res.send(201);
        next()
    }, function(err) {
        next(err);
    });
};

function getPointsForContainer(id, containerData, hostId, date, series) {
    if (containerData.Info.Running) {
        series.cpu_series.push(getCpuPointForContainer(id, containerData, hostId, date));
        series.memory_series.push(getMemoryPointForContainer(id, containerData, hostId, date));
        series.network_series.push(getNetworkPointForContainer(id, containerData, hostId, date));
        series.status_series.push(getStatusPointForContainer(id, containerData, hostId, date));
    }
}

function getCpuPointForContainer(id, containerData, hostId, date) {
    var data = containerData.Cpu;
    return {
        time: date,
        container: id,
        host: hostId,
        user: data.User,
        system: data.System
    };
}

function getMemoryPointForContainer(id, containerData, hostId, date) {
    var data = containerData.Memory;
    return {
        time: date,
        container: id,
        host: hostId,
        rss: data.Rss,
        cache: data.Cache,
        total: data.Total,
        swap: data.Swap
    };
}

function getNetworkPointForContainer(id, containerData, hostId, date) {
    var data = containerData.Network;
    return {
        time: date,
        container: id,
        host: hostId,
        rxOk: data.RxOk,
        rxErr: data.RxErr,
        txOk: data.TxOk,
        txErr: data.TxErr
    };
}

function getStatusPointForContainer(id, containerData, hostId, date) {
    var data = containerData.Info;
    return {
        time: date,
        container: id,
        host: hostId,
        state: data.Running
    };
}
