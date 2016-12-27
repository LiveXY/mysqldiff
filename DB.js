var mysql = require("mysql");
var Tools = require("./Tools");

function DB(connectionString) {
    var self = this, conn = null, tunnel = null,
        dbConfig = null, sshConfig = null, localPort = 0;

    function dbConnect(config) {
        conn = mysql.createConnection(config);
        return new Promise(function(resolve, reject) {
            conn.connect(function(err) {
                resolve(err);
            });
        });
    }
    function sshConnect(config) {
        return Tools.exec(__dirname + '/ssh ' + config).then(function(err){ return null; });
    }
    function initDBConfig(config) {
        dbConfig = Tools.dbConfig(config);
    }
    function initSSHConfig(config) {
        var index1 = config.indexOf(':');
        var index2 = config.lastIndexOf('@');
        var index3 = config.lastIndexOf('#');
        if (index1 == -1 || index2 == -1) return;
        if (index3 == -1 || index3<index2) index3 = config.length;

        var user = config.substring(0, index1);
        var password = config.substring(index1+1, index2);
        var host = config.substring(index2+1);
        var port = parseInt(config.substring(index3+1)) || 0;
        if (port < 1) port = 22;

        localPort = Tools.randPort();
        sshConfig = localPort+':'+dbConfig.host+':'+dbConfig.port+' '+user+'@'+host+' '+password+' '+port;
        dbConfig.port = localPort;
        dbConfig.host = '127.0.0.1';
    }
    function init() {
        var all = connectionString.split('+');
        if (all.length > 0) initDBConfig(all[0]);
        if (all.length > 1) initSSHConfig(all[1]);
        return self;
    }
    this.getUser = function() {
        return dbConfig.user;
    }
    this.connect = function () {
        if (!dbConfig) return Promise.resolve(new Error('数据库配置参数错误!'));
        if (!sshConfig) return dbConnect(dbConfig);
        if (!sshConfig) return Promise.resolve(new Error('SSH配置参数错误!'));
        return sshConnect(sshConfig).then(function(){
            return dbConnect(dbConfig);
        });
    }
    this.query = function (sql, params) {
        return new Promise(function(resolve, reject) {
            conn.query(sql, params, function(err, result) {
                if (err) console.error(err);
                resolve(result);
            });
        });
    }
    this.first = function (sql, params) {
        var self = this;
        return new Promise(function(resolve, reject) {
            conn.query(sql, params, function(err, result) {
                if (err) console.error(err);
                resolve(result ? result[0] : null);
            });
        });
    }
    this.parameters = function() {
        var sql = 'select distinct specific_name parName, routine_type type from information_schema.parameters where specific_schema=?';
        return self.query(sql, [dbConfig.database]);
    }
    this.tables = function() {
        var sql = 'select table_name tabName from information_schema.tables where table_schema=?';
        return self.query(sql, [dbConfig.database]);
    }
    this.showCreateTable = function(table) {
        var sql = 'show create table ' + table;
        return self.first(sql).then(function(v){ return v['Create Table']; });
    }
    this.showCreateProcedure = function(proc) {
        var sql = 'show create procedure ' + proc;
        return self.first(sql).then(function(v){ return v['Create Procedure']; });
    }
    this.showCreateFunction = function(func) {
        var sql = 'show create function ' + func;
        return self.first(sql).then(function(v){ return v['Create Function']; });
    }
    this.getData = function(table) {
        var sql = 'select * from ' + table + ' limit 1000';
        return self.query(sql);
    }
    this.close = function() {
        conn.destroy();
        if (!sshConfig || localPort == 0) return Promise.resolve(null);
        var findCMD = 'ps aux | grep "ssh -f -N -L '+localPort+':"';
        return Tools.exec(findCMD).then(function(err){
            var errs = err.split('\n');
            for(var i=0,len=errs.length;i<len;i++) {
                var e = errs[i];
                if (e.indexOf('grep ') != -1) continue;
                var pid = e.match(/ (\d+) /g)[0].trim();
                return pid;
            }
            return null;
        }).then(function(pid){
            if (!pid) return null;
            return Tools.exec('kill -9 '+pid);
        });
    }
    return init();
}

module.exports = DB;