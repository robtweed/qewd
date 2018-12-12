/*

 ----------------------------------------------------------------------------
 | qewd-up: Rapid QEWD API Development                                      |
 |                                                                          |
 | Copyright (c) 2018 M/Gateway Developments Ltd,                           |
 | Redhill, Surrey UK.                                                      |
 | All rights reserved.                                                     |
 |                                                                          |
 | http://www.mgateway.com                                                  |
 | Email: rtweed@mgateway.com                                               |
 |                                                                          |
 |                                                                          |
 | Licensed under the Apache License, Version 2.0 (the "License");          |
 | you may not use this file except in compliance with the License.         |
 | You may obtain a copy of the License at                                  |
 |                                                                          |
 |     http://www.apache.org/licenses/LICENSE-2.0                           |
 |                                                                          |
 | Unless required by applicable law or agreed to in writing, software      |
 | distributed under the License is distributed on an "AS IS" BASIS,        |
 | WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. |
 | See the License for the specific language governing permissions and      |
 |  limitations under the License.                                          |
 ----------------------------------------------------------------------------

  12 December 2018

*/

console.log('Loading /up/run.js in process ' + process.pid);

var fs = require('fs');
var child_process = require('child_process');
var qewd = require('../lib/master');

function linkMonitor(cwd, name) {
  if (name !== '') name = '/' + name;
  var webServerRootPath = cwd + name + '/www';
  if (!fs.existsSync(webServerRootPath)) {
   fs.mkdirSync(webServerRootPath);
  }
  var cmd = 'ln -sf ' + process.cwd() + '/node_modules/qewd-monitor/www ' + webServerRootPath + '/qewd-monitor';
  child_process.execSync(cmd, {stdio:[0,1,2]});
}

function unlinkMonitor(cwd, name) {
  if (name !== '') name = '/' + name;
  var path = cwd + name + '/www/qewd-monitor'
  if (fs.existsSync(path)) {
    var cmd = 'unlink ' + path;
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

  if (!isDocker && !config_data.orchestrator && config_data.qewd) {
    config_data.orchestrator = {
      qewd: config_data.qewd
    };
  }

  var routes;
  var ms_config;
  var routes_data;
  var ms_index = {};
  var webServerRootPath = process.cwd() + '/www/';
  var serviceName;

  if (ms_name) {
    webServerRootPath = cwd + '/' + ms_name + '/www/';
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
      console.log('1 enabling qewd-monitor');
      linkMonitor(cwd, ms_name);
    }
    else {
      unlinkMonitor(cwd, ms_name);
    }

  }
  else {

    console.log('config_data: ' + JSON.stringify(config_data, null, 2));

    if (config_data.orchestrator) {
      if (isDocker) {
        webServerRootPath = cwd + '/orchestrator/www/';
        serviceName = 'orchestrator';
      }
      else {
        webServerRootPath = cwd + '/www/';
        serviceName = '';
      }
      if (config_data.orchestrator['qewd-monitor'] !== false) {
        console.log('2 enabling qewd-monitor');
        linkMonitor(cwd, serviceName);
      }
      else {
        unlinkMonitor(cwd, serviceName);
      }
    }
    else {
      if (isDocker) {
        if (config_data.microservices) {
          webServerRootPath = cwd + '/orchestrator/www/';
          serviceName = 'orchestrator';
          console.log('3 enabling qewd-monitor *');
          linkMonitor(cwd, serviceName);
        }
        else {
          // Docker monolith
          webServerRootPath = cwd + '/www/';
          serviceName = '';

          if (config_data['qewd-monitor'] !== false) {
            console.log('4 enabling qewd-monitor');
            linkMonitor(cwd, serviceName);
          }
          else {
            unlinkMonitor(cwd, serviceName);
          }
        }
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
      type: '=> either(orchestrator.qewd.database.type, "gtm")',
      params: '=> either(orchestrator.qewd.database.params, "<!delete>")',
    },
    webServerRootPath: webServerRootPath
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

            //var onRequestPath = cwd + '/' + route.on_microservice + '/handlers/' + route.handler + '/onRequest.js';
            var onRequestPath = cwd + '/' + route.on_microservice + '/' + route.handler + '/onRequest.js';
            console.log('Checking for onRequest path: ' + onRequestPath);
            if (fs.existsSync(onRequestPath)) {
              routeObj.onRequest = require(onRequestPath);
              console.log('Adding onRequest handler for ' + route.uri + ': ' + onRequestPath);
            }

            //var onResponsePath = cwd + '/' + route.on_microservice + '/handlers/' + route.handler + '/onResponse.js';
            var onResponsePath = cwd + '/' + route.on_microservice + '/' + route.handler + '/onResponse.js';
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

        var handlerPath = cwd + '/apis';
        var orchestratorHandlerPath = cwd + '/orchestrator/apis';
        if (fs.existsSync(orchestratorHandlerPath)) {
          handlerPath = orchestratorHandlerPath;
        }
        //var beforeRouterPath = handlerPath + path_root + '/beforeRouter.js';
        var beforeRouterPath = handlerPath + '/beforeRouter.js';
        console.log('beforeRouterPath: ' + beforeRouterPath);
        if (fs.existsSync(beforeRouterPath)) {
          routeObj.beforeRouter = [require(beforeRouterPath)];
        }

        //var afterRouterPath = handlerPath + path_root + '/afterRouter.js';
        var afterRouterPath = handlerPath + '/afterRouter.js';
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
