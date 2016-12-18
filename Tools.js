var cp = require('child_process');

exports.exec = function (cmd, option) {
	return new Promise(function(resolve, reject) {
		cp.exec(cmd, option, function(err, stdout, stderr) {
			resolve(err ? err.message : stdout);
		});
    });
}
exports.dbConfig = function(config) {
	var index1 = config.indexOf(':');
    var index2 = config.lastIndexOf('@');
    var index3 = config.lastIndexOf('~');
    var index4 = config.lastIndexOf('#');
    if (index1 == -1 || index2 == -1 || index3 == -1) return;
    if (index4 == -1 || index4<index2) index4 = config.length;

    var user = config.substring(0, index1);
    var password = config.substring(index1+1, index2);
    var host = config.substring(index2+1, index3);
    var database = config.substring(index3+1, index4);
    var port = config.substring(index4+1);

    return {
        'host': host,
        'port': !port ? 3306 : parseInt(port),
        'user': user,
        'password': password,
        'database': database
    };
}
exports.rand = function(min, max) {
    return min + Math.round(Math.random()*(max-min));
}
exports.randPort = function() {
    return exports.rand(32000, 35000);
}