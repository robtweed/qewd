console.log('!!*** loading /up/run.js in process ' + process.pid);

var fs = require('fs');
var child_process = require('child_process');
var qewd = require('../lib/master');

function linkMonitor(cwd) {
  var cmd = 'ln -sf ' + cwd + '/node_modules/qewd-monitor/www ' + cwd + '/www/qewd-monitor';
  child_process.execSync(cmd, {stdio:[0,1,2]});
}

function unlinkMonitor(cwd) {
  if (fs.existsSync(cwd + '/www/qewd-monitor')) {
    var cmd = 'unlink ' + cwd + '/www/qewd-monitor';
    child_process.execSync(cmd, {stdio:[0,1,2]});
  }
}

function setup(isDocker) {

  var cwd = process.cwd();
  var ms_name = process.env.microservice;
  var uuid;

  if (isDocker) {
    cwd = cwd + '/mapped';
    uuid = require('uuid/v4'); // loaded as dependency of ewd-session
  }

  console.log('isDocker: ' + isDocker);
  console.log('cwd = ' + cwd);

  var config_data;
  try {
    config_data = require(cwd + '/configuration/config.json');
  }
  catch(err) {
    config_data = {
      orchestrator: {}
    };
  }

  if (!fs.existsSync(cwd + '/www')) {
    fs.mkdirSync(cwd + '/www');
  }

  var routes;
  var ms_config;
  var routes_data;
  var ms_index = {};

  if (ms_name) {
    // this is running a microservice container
    config_data.microservices.forEach(function(microservice, index) {
      ms_index[microservice.name] = index;
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

    if (ms_config.qewd['qewd-monitor'] !== false) {
      console.log('enabling qewd-monitor');
      linkMonitor(cwd);
    }
    else {
      unlinkMonitor(cwd);
    }

  }
  else {

    if (config_data.orchestrator) {
      if (config_data.orchestrator['qewd-monitor'] !== false) {
        console.log('enabling qewd-monitor');
        linkMonitor(cwd);
      }
      else {
        unlinkMonitor(cwd);
      }
    }

    try {
      routes_data = require(cwd + '/configuration/routes.json');
    }
    catch(err) {
      routes_data = [];
    }

    routes = [];
    var roots = {};
  }

  var transform = require('qewd-transform-json').transform;
  var helpers = {};

  var config_template = {
    managementPassword: '=> either(orchestrator.qewd.managementPassword, "keepThisSecret!")',
    serverName: '=> either(orchestrator.qewd.serverName, "QEWD Server")',
    port: '=> either(orchestrator.qewd.port, 8080)',
    poolSize: '=> either(orchestrator.qewd.poolSize, 2)',
    database: {
      type: 'gtm'
    },
  };

  var config;

  if (ms_name) {
    config = transform(config_template, ms_config, helpers);
  }
  else {
    config = transform(config_template, config_data, helpers);
  }

  if (isDocker) {

    if (ms_name) {
      // This is a micro-service, not the orchestrator
      routes = [{
        path: ms_config.name,
        module: __dirname + '/ms_handlers',
        errors: {
          notfound: {
            text: 'Resource Not Recognised',
            statusCode: 404
          }
        }
      }];

      if (ms_config.connections) {
        config.u_services = {
          destinations: {}
        };

        ms_config.connections.forEach(function(ms_name) {
          var index = ms_index[ms_name];
          if (typeof index !== 'undefined') {
            var ms_info = config_data.microservices[index];
            var host = ms_info.host;
            var port = ms_info.port;
            if (port !== 80 && port !== 443) {
              host = host + ':' + port;
            }
            config.u_services.destinations[ms_info.name] = {
              host: host,
              application: ms_info.name
            };
          }
        });

        try {
          routes_data = require(cwd + '/configuration/routes.json');
        }
        catch(err) {
          routes_data = [];
        }
        var ms_routes = [];
        routes_data.forEach(function(route) {
          if (route.from_microservices) {
            route.from_microservices.forEach(function(from_ms) {
              if (from_ms === ms_name) {
                ms_routes.push(route);
              }
            });
          }
        });
        if (ms_routes.length > 0) {
          config.u_services.routes = [];
          ms_routes.forEach(function(route) {
            config.u_services.routes.push({
              path: route.uri,
              method: route.method,
              destination: route.on_microservice
            });
          });  
        }
      }

      console.log('microservice config = ' + JSON.stringify(config, null, 2));

    }
    else {
      // This is the orchestrator (or Docker monolith)
      // Add in microservice definitions if present

      console.log('config_data.microservices: ' + JSON.stringify(config_data.microservices, null, 2));

      if (config_data.microservices && Array.isArray(config_data.microservices)) {
        config.u_services = {
          destinations: {},
          routes: []
        };
        var destinations = config.u_services.destinations;
        config_data.microservices.forEach(function(microservice) {

          if (microservice.members) {
            // group destination
            destinations[microservice.name] = {
              destinations: microservice.members
            }
          }
          else {
            // physical endpoint destination
            destinations[microservice.name] = {
              host: microservice.host + ':' + microservice.port,
              application: microservice.name
            };
          }
        });

        routes_data.forEach(function(route) {
          if (route.on_microservice || route.on_microservices) {

            if (route.from_microservices) {
              // is this route not sourced by conductor?  If so, ignore on conductor
              var onConductor = false;
              route.from_microservices.forEach(function(ms_name) {
                if (ms_name === 'orchestrator') {
                  onConductor = true;
                }
              });
              if (!onConductor) return;
            }

            var routeObj = {
              path: route.uri,
              method: route.method,
              destination: route.on_microservice
            };

            var onRequestPath = cwd + '/' + route.on_microservice + '/handlers/' + route.handler + '/onRequest.js';
            console.log('Checking for onRequest path: ' + onRequestPath);
            if (fs.existsSync(onRequestPath)) {
              routeObj.onRequest = require(onRequestPath);
              console.log('Adding onRequest handler for ' + route.uri + ': ' + onRequestPath);
            }

            var onResponsePath = cwd + '/' + route.on_microservice + '/handlers/' + route.handler + '/onResponse.js';
            console.log('Checking for onResponse path: ' + onResponsePath);
            if (fs.existsSync(onResponsePath)) {
              routeObj.onResponse = require(onResponsePath);
              console.log('Adding onResponse handler for ' + route.uri + ': ' + onResponsePath);
            }

            config.u_services.routes.push(routeObj);
          }
        });
      }
    }

    if (!config_data.jwt || !config_data.jwt.secret) {
      config_data.jwt = {
        secret: uuid()
      };
      // write it back to cwd + '/configuration/config.json'
      fs.writeFileSync(cwd + '/configuration/config.json', JSON.stringify(config_data, null, 2));
    }
    config.jwt = config_data.jwt;
  }

  if (!ms_name) {

    routes_data.forEach(function(route) {
      if (route.else) return;

      var path_root = '/' + route.uri.split('/')[1];
      if (!roots[path_root]) {

        var routeObj = {
          path: path_root,
          module: __dirname + '/handlers'
        };

        var handlerPath = cwd + '/handlers';
        var orchestratorHandlerPath = cwd + '/orchestrator/handlers';
        if (fs.existsSync(orchestratorHandlerPath)) {
          handlerPath = orchestratorHandlerPath;
        }

        var beforeRouterPath = handlerPath + path_root + '/beforeRouter.js';
        console.log('beforeRouterPath: ' + beforeRouterPath);
        if (fs.existsSync(beforeRouterPath)) {
          routeObj.beforeRouter = [require(beforeRouterPath)];
        }

        var afterRouterPath = handlerPath + path_root + '/afterRouter.js';
        console.log('afterRouterPath: ' + afterRouterPath);
        if (fs.existsSync(afterRouterPath)) {
          routeObj.afterRouter = [require(afterRouterPath)];
        }

        routes.push(routeObj);
        roots[path_root] = true;
      }
    });
  }

  return {
    routes: routes,
    config: config,
    cwd: cwd
  };
}

module.exports = function(isDocker) {

  console.log('running module.exports function for run.js');

  var results = setup(isDocker);
  var config = results.config;
  var routes = results.routes;
  var cwd = results.cwd;

  console.log('master config: ' + JSON.stringify(config, null ,2));
  console.log('routes: ' + JSON.stringify(routes, null, 2));

  var ms_name = process.env.microservice;

  var onStartedPath;
  var onStartedPath2;

  if (ms_name) {
    onStartedPath = cwd + '/microservices/' + ms_name + '/onStarted.js';
  }
  else {
    onStartedPath = cwd + '/orchestrator/onStarted.js';
    onStartedPath2 = cwd + '/onStarted.js';
  }

  if (isDocker) {

    var exportObj = {
      config: config,
      routes: routes
    };

    if (fs.existsSync(onStartedPath)) {
      exportObj.onStarted = require(onStartedPath);
    }
    else if (fs.existsSync(onStartedPath2)) {
      exportObj.onStarted = require(onStartedPath2);
    }
    return exportObj;
  }
  else {

    try {
      console.log('Running down YottaDB...');
      child_process.execSync(process.env.ydb_dist + '/mupip rundown -region DEFAULT', {stdio:[0,1,2]});
      child_process.execSync(process.env.ydb_dist + '/mupip rundown -region qewdreg', {stdio:[0,1,2]});
      console.log('Rundown completed');
    }
    catch(err) {
      console.log('Error running down YottaDB: ' + err);
      console.log('Recovering journal...');
      child_process.execSync(process.env.ydb_dist + '/mupip journal -recover -backward ' + process.env.ydb_dir + '/' + process.env.ydb_rel + '/g/yottadb.mjl', {stdio:[0,1,2]});
      console.log('Journal recovered');
    }

    var q = qewd.start(config, routes);

    if (fs.existsSync(onStartedPath)) {
      require(onStartedPath).call(q, config);
    }
    else if (fs.existsSync(onStartedPath2)) {
      require(onStartedPath2).call(q, config);
    }
  }
};
