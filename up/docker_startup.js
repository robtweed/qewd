function startup() {

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

  console.log('up.docker_startup - starting conductor service');
  console.log('cwd = ' + cwd);

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
    }
  };

  var routes = [];
  var roots = {};
  var config = transform(config_template, config_data, helpers);

  // Add in microservice definitions if present

  console.log('config_data.microservices: ' + JSON.stringify(config_data.microservices, null, 2));

  if (config_data.microservices && Array.isArray(config_data.microservices)) {
    config.u_services = {
      destinations: {},
      routes: []
    };
    var destinations = config.u_services.destinations;
    config_data.microservices.forEach(function(microservice) {  
      destinations[microservice.name] = {
        host: microservice.host + ':' + microservice.port,
        application: microservice.name
      };
    });

    routes_data.forEach(function(route) {
      if (route.on_microservice) {
        config.u_services.routes.push({
          path: route.uri,
          method: route.method,
          destination: route.on_microservice
        });
      }
    });

    if (!config_data.jwt || !config_data.jwt.secret) {
      config_data.jwt = {
        secret: uuid()
      };
    }
    config.jwt = config_data.jwt;
  }

  // local routes

  routes_data.forEach(function(route) {
   var path_root = '/' + route.uri.split('/')[1];
    if (!roots[path_root]) {

      var routeObj = {
        path: path_root,
        module: __dirname + '/lib/handlers'
      };

      var beforeRouterPath = cwd + '/handlers' + path_root + '/beforeRouter.js';
      console.log('beforeRouterPath: ' + beforeRouterPath);
      if (fs.existsSync(beforeRouterPath)) {
        routeObj.beforeRouter = [require(beforeRouterPath)];
      }

      var afterRouterPath = cwd + '/handlers' + path_root + '/afterRouter.js';
      console.log('afterRouterPath: ' + afterRouterPath);
      if (fs.existsSync(afterRouterPath)) {
        routeObj.afterRouter = [require(afterRouterPath)];
      }

      routes.push(routeObj);

      roots[path_root] = true;
    }
  });

  console.log('config: ' + JSON.stringify(config, null, 2));
  console.log('routes: ' + JSON.stringify(routes, null, 2));

  var exportObj = {
    config: config,
    routes: routes
  };

  var onStartedPath = cwd + '/conductor/onStarted.js';
  var onStartedPath2 = cwd + '/onStarted.js';
  if (fs.existsSync(onStartedPath)) {
    exportObj.onStarted = require(onStartedPath);
  }
  else if (fs.existsSync(onStartedPath2)) {
    exportObj.onStarted = require(onStartedPath2);
  }

  return exportObj;
}

module.exports = startup();
