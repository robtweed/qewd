var fs = require('fs');
var child_process = require('child_process');
var uuid = require('uuid/v4'); // loaded as dependency of ewd-session

var cwd = process.cwd() + '/mapped';
var config_data;
try {
  config_data = require(cwd + '/configuration/config.json');
}
catch(err) {
  config_data = {
    conductor: {}
  };
}

console.log('cwd = ' + cwd);

if (!fs.existsSync(cwd + '/www')) {
  fs.mkdirSync(cwd + '/www');
}

var ms_name = process.env.microservice;
var ms_config;
config_data.microservices.forEach(function(microservice) {
  if (microservice.name === ms_name) {
    ms_config = microservice;
  }
});

if (!ms_config) {
  console.log('Error: Unable to find configuration details for a microservice named ' + ms_name);
  return;
}

if (!ms_config.qewd) {
  ms_config.qewd = {};
}

var cmd;
if (ms_config.qewd['qewd-monitor'] !== false) {
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

var transform = require('qewd-transform-json').transform;
var helpers = {};

var config_template = {
  managementPassword: '=> either(qewd.managementPassword, "keepThisSecret!")',
  serverName: '=> either(qewd.serverName, "QEWD Server")',
  port: '=> either(qewd.port, 8080)',
  poolSize: '=> either(qewd.poolSize, 2)',
  database: {
    type: 'gtm'
  }
};

var config = transform(config_template, ms_config, helpers);

if (!config_data.jwt || !config_data.jwt.secret) {
  config_data.jwt = {
    secret: uuid()
  };
}
config.jwt = config_data.jwt;

console.log('config: ' + JSON.stringify(config, null, 2));

var routes = [{
  path: ms_config.name,
  module: __dirname + '/lib/ms_handlers',
  errors: {
    notfound: {
      text: 'Resource Not Recognised',
      statusCode: 404
    }
  }
}];

module.exports = {
  config: config,
  routes: routes
};
