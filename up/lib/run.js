var fs = require('fs');
var child_process = require('child_process');
var qewd = require('../../lib/master');

module.exports = function() {

  var cwd = process.cwd();

  var config_data;
  try {
    config_data = require(cwd + '/configuration/config.json');
  }
  catch(err) {
    config_data = {
      conductor: {}
    };
  }

  if (!fs.existsSync(cwd + '/www')) {
    fs.mkdirSync(cwd + '/www');
  }

  if (config_data.conductor) {
    var cmd;
    if (config_data.conductor['qewd-monitor'] !== false) {
      console.log('enabling qewd-monitor');
      cmd = 'ln -sf ' + cwd + '/node_modules/qewd-monitor/www ' + cwd + '/www/qewd-monitor';
      child_process.execSync(cmd, {stdio:[0,1,2]});
    }
    else {
      if (fs.existsSync(cwd + '/www/qewd-monitor')) {
        cmd = 'unlink ' + cwd + '/www/qewd-monitor';
        child_process.execSync(cmd, {stdio:[0,1,2]});
      }
    }
  }

  var routes_data;
  try {
    routes_data = require(cwd + '/configuration/routes.json');
  }
  catch(err) {
    routes_data = [];
  }

  var transform = require('qewd-transform-json').transform;
  //var helpers = require('./helpers');
  var helpers = {};

  var config_template = {
    managementPassword: '=> either(conductor.qewd.managementPassword, "keepThisSecret!")',
    serverName: '=> either(conductor.qewd.serverName, "QEWD Server")',
    port: '=> either(conductor.qewd.port, 8080)',
    poolSize: '=> either(conductor.qewd.poolSize, 2)',
    database: {
      type: 'gtm'
    },
  };

  var routes = [];
  var roots = {};
  var config = transform(config_template, config_data, helpers);

  //console.log('cwd = ' + process.cwd());
  //console.log('__dirname: ' + __dirname);

  routes_data.forEach(function(route) {
    var path_root = '/' + route.uri.split('/')[1];
    if (!roots[path_root]) {
      routes.push({
        path: path_root,
        module: __dirname + '/handlers'
      });
      roots[path_root] = true;
    }
  });

  console.log('master config: ' + JSON.stringify(config, null ,2));

  qewd.start(config, routes);
};
