/*

 ----------------------------------------------------------------------------
 | qewd-up: Rapid QEWD API Development                                      |
 |                                                                          |
 | Copyright (c) 2018-20 M/Gateway Developments Ltd,                        |
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

 2 July 2020

*/

//console.log('Loading /up/run.js in process ' + process.pid);

var fs = require('fs-extra');
var path = require('path');
var os = require('os');
var module_exists = require('module-exists');
var child_process = require('child_process');
var qewd = require('../lib/master');
var uuid = require('uuid/v4'); // loaded as dependency of ewd-session

function getDirectories(path) {
  return fs.readdirSync(path).filter(function(file) {
    return fs.statSync(path + '/' + file).isDirectory();
  });
}

function createModuleMap(cwd, config) {
  var qewdAppsPath = cwd + '/qewd-apps';
  if (fs.existsSync(qewdAppsPath)) {
    if (!config.moduleMap) {
      config.moduleMap = {};
    }
    var appList = getDirectories(qewdAppsPath);
    appList.forEach(function(appName) {
      var appPath = qewdAppsPath + '/' + appName;
      var indexPath = appPath + '/index.js';
      var handlerList = getDirectories(appPath);
      // if handler modules exist, create the dynamic handler for this path
      //  otherwise use the existing index.js
      if (handlerList.length > 0) {
        var text;
        //text = "module.exports = require('" + __dirname + "/qewdAppHandler" + "')('" + appPath + "');"
        var reqPath = path.join(__dirname, 'qewdAppHandler');
        var appPath2 = path.normalize(appPath);
        if (os.platform() === 'win32') {
          reqPath = reqPath.split('\\').join('\\\\');
          appPath2 = appPath2.split('\\').join('\\\\');
        }
        text = "module.exports = require('" + reqPath + "')('" + appPath2 + "');"
        fs.writeFileSync(indexPath, text);
      }
      if (fs.existsSync(indexPath)) {
        config.moduleMap[appName] = appPath;
      }
    });
  }
}

function installModule(moduleName, modulePath) {
  var pieces = moduleName.split('@');
  var rootName;
  if (moduleName.startsWith('@')) {
    rootName = '@' + pieces[1];
  }
  else {
    rootName = pieces[0];
  }
  if (!module_exists(rootName) && !fs.existsSync(modulePath + '/node_modules/' + rootName)) {
    var prefix = '';
    if (typeof modulePath !== 'undefined') {
      prefix = ' --prefix ' + modulePath;
    }
    child_process.execSync('npm install --unsafe-perm ' + moduleName + prefix, {stdio:[0,1,2]});
    console.log('\n' + moduleName + ' installed');
  }
  else {
    console.log(moduleName + ' already installed');
  }
}

function installModules(cwd) {
  var npmModules;
  var modulePath;
  if (fs.existsSync(cwd + '/install_modules.json')) {
    if (!fs.existsSync(cwd + '/node_modules')) {
      fs.mkdirSync(cwd + '/node_modules');
    }

    process.env.NODE_PATH = cwd + '/node_modules:' + process.env.NODE_PATH;
    require('module').Module._initPaths();

    npmModules = require(cwd + '/install_modules.json');
    npmModules.forEach(function(moduleName) {
      console.log('\nInstalling module ' + moduleName + ' to ' + cwd);
      installModule(moduleName, cwd);
    });
    console.log('** NODE_PATH = ' + process.env.NODE_PATH);
  }
}

function linkMonitor(cwd, name) {
  if (name !== '') {
    name = '/' + name;
    var path1 = cwd + name;
    if (process.env.mode && process.env.microservice) {
      path1 = cwd;
    }
    if (!fs.existsSync(path1)) {
      fs.mkdirSync(path1);
    }
  }
  var webServerRootPath = cwd + name + '/www';
  if (process.env.mode && process.env.microservice) {
    webServerRootPath = cwd + '/www';
  }
  if (!fs.existsSync(webServerRootPath)) {
   fs.mkdirSync(webServerRootPath);
  }
  if (process.platform === 'win32') {
    fs.copySync(process.cwd() + '/node_modules/qewd-monitor/www', webServerRootPath + '/qewd-monitor');
    fs.copySync(process.cwd() + '/node_modules/ewd-client/lib/proto/ewd-client.js', webServerRootPath + '/ewd-client.js');
    let fromPath = process.cwd() + '/www/qewd-client.js';
    let toPath = webServerRootPath + '/qewd-client.js';
    if (!fs.existsSync(toPath) && fs.existsSync(fromPath)) {
      fs.copySync(fromPath, toPath);
    }
    fromPath = process.cwd() + '/www/mg-webComponents.js';
    toPath = webServerRootPath + '/mg-webComponents.js';
    if (!fs.existsSync(toPath) && fs.existsSync(fromPath)) {
      fs.copySync(fromPath, toPath);
    }
    fromPath = process.cwd() + '/www/components';
    toPath = webServerRootPath + '/components';
    if (!fs.existsSync(toPath) && fs.existsSync(fromPath)) {
      fs.copySync(fromPath, toPath);
    }
    fromPath = process.cwd() + '/www/qewd-monitor-adminui';
    toPath = webServerRootPath + '/qewd-monitor-adminui';
    if (!fs.existsSync(toPath) && fs.existsSync(fromPath)) {
      fs.copySync(fromPath, toPath);
    }
 }
  else {

    let samePath = (process.cwd() + '/www' === webServerRootPath);

    var cmd = 'ln -sf ' + process.cwd() + '/node_modules/qewd-monitor/www ' + webServerRootPath + '/qewd-monitor';
    child_process.execSync(cmd, {stdio:[0,1,2]});

    cmd = 'ln -sf ' + process.cwd() + '/node_modules/ewd-client/lib/proto/ewd-client.js ' + webServerRootPath + '/ewd-client.js';
    child_process.execSync(cmd, {stdio:[0,1,2]});

    if (!samePath) {

      if (fs.existsSync(process.cwd() + '/www/qewd-client.js')) {
        cmd = 'ln -sf ' + process.cwd() + '/www/qewd-client.js ' + webServerRootPath + '/qewd-client.js';
        child_process.execSync(cmd, {stdio:[0,1,2]});
      }

      if (fs.existsSync(process.cwd() + '/www/mg-webComponents.js')) {
        cmd = 'ln -sf ' + process.cwd() + '/www/mg-webComponents.js ' + webServerRootPath + '/mg-webComponents.js';
        child_process.execSync(cmd, {stdio:[0,1,2]});

        if (!fs.existsSync(webServerRootPath + '/components')) {
          fs.mkdirSync(webServerRootPath + '/components');
        }

        if (fs.existsSync(process.cwd() + '/www/components/adminui') && !fs.existsSync(webServerRootPath + '/components/adminui')) {
          fs.mkdirSync(webServerRootPath + '/components/adminui');
          cmd = 'cp -r ' + process.cwd() + '/www/components/adminui ' + webServerRootPath + '/components';
          child_process.execSync(cmd, {stdio:[0,1,2]});
        }

        if (fs.existsSync(process.cwd() + '/www/components/leaflet') && !fs.existsSync(webServerRootPath + '/components/leaflet')) {
          fs.mkdirSync(webServerRootPath + '/components/leaflet');
          cmd = 'cp -r ' + process.cwd() + '/www/components/leaflet ' + webServerRootPath + '/components';
          child_process.execSync(cmd, {stdio:[0,1,2]});
        }

        if (fs.existsSync(process.cwd() + '/www/components/d3') && !fs.existsSync(webServerRootPath + '/components/d3')) {
          fs.mkdirSync(webServerRootPath + '/components/d3');
          cmd = 'cp -r ' + process.cwd() + '/www/components/d3 ' + webServerRootPath + '/components';
          child_process.execSync(cmd, {stdio:[0,1,2]});
        }

        if (fs.existsSync(process.cwd() + '/www/qewd-monitor-adminui') && !fs.existsSync(webServerRootPath + '/qewd-monitor-adminui')) {
          fs.mkdirSync(webServerRootPath + '/qewd-monitor-adminui');
          cmd = 'cp -r ' + process.cwd() + '/www/qewd-monitor-adminui ' + webServerRootPath;
          child_process.execSync(cmd, {stdio:[0,1,2]});
        }
      }
    }

    if (!fs.existsSync(cwd + '/qewd-apps/qewd-monitor-adminui')) {
      fs.mkdirSync(cwd + '/qewd-apps/qewd-monitor-adminui');

      cmd = 'mv ' + webServerRootPath + '/qewd-monitor-adminui/qewd-apps/* ' + cwd + '/qewd-apps/qewd-monitor-adminui';
      child_process.execSync(cmd, {stdio:[0,1,2]});

      cmd = 'rm -r ' + webServerRootPath + '/qewd-monitor-adminui/qewd-apps';
      child_process.execSync(cmd, {stdio:[0,1,2]});
    }
  }
}

function unlinkMonitor(cwd, name) {
  if (name !== '') name = '/' + name;
  var path = cwd + name + '/www/qewd-monitor'
  if (process.env.mode && process.env.microservice) {
    path = cwd + '/www/qewd-monitor';
  }
  if (fs.existsSync(path)) {
    var cmd = 'unlink ' + path;
    child_process.execSync(cmd, {stdio:[0,1,2]});
  }
}

function updateRoutes(json) {
  fs.writeFileSync('/opt/qewd/mapped/configuration/routes.json', JSON.stringify(json, null, 2));
}

function addImportRoute(config_data, routes) {
  var startMode = 'normal';
  if (!config_data.microservices) return startMode;

  var on_microservices = [];
  config_data.microservices.forEach(function(ms) {
    if (ms.apis && ms.apis.import && !ms.apis.imported) {
      // this microservice needs to be imported
      on_microservices.push(ms.name);
    }
  });

  if (on_microservices.length > 0) {

    startMode = 'import';

    // add temporary route to allow import of microservice routes

    routes.push({
      uri: '/qewd/importRoutes/:destination',
      method: 'POST',
      on_microservices: on_microservices,
      authenticate: false,
      bypassJWTCheck: true
    });

    updateRoutes(routes);
  }
  return startMode;
}

function setup(isDocker, service_name, isNative) {

  if (isNative) {
    process.env.qewd_service_name = service_name;
    process.env.qewd_isNative = true;
    if (service_name !== 'orchestrator') {
      process.env.mode = 'microservice';
    }
  }

  var cwd = process.cwd();
  if (service_name) {
    if (isNative) {
      // leave cwd alone
    }
    else {
      cwd = cwd + '/' + service_name;
    }
  }
  var ms_name = process.env.microservice;
  var mode = process.env.mode;
  var startupMode = 'normal';

  if (isDocker) {
    cwd = cwd + '/mapped';
    installModules(cwd);
  }

  var config_data;
  console.log('** loading ' + cwd + '/configuration/config.json');
  try {
    config_data = require(cwd + '/configuration/config.json');
  }
  catch(err) {
    config_data = {
      //orchestrator: {}
    };
  }

  /*
  if (!isDocker && !config_data.orchestrator && config_data.qewd) {
    config_data.orchestrator = {
      qewd: config_data.qewd
    };
  }
  */

  var routes;
  var ms_config;
  var routes_data;
  var ms_index = {};
  var webServerRootPath = process.cwd() + '/www/';
  var serviceName;

  if (ms_name || mode) {
    if (ms_name) {
      webServerRootPath = cwd + '/' + ms_name + '/www/';
    }
    // this is running a microservice container
    if (config_data.microservices) {
      config_data.microservices.forEach(function(microservice, index) {
        ms_index[microservice.name] = index;
        if (microservice.name === ms_name) {
          ms_config = microservice;
        }
      });
    }

    if (!mode && !ms_config) {
      console.log('Error: Unable to find configuration details for a microservice named ' + ms_name);
      return;
    }

    if (mode) {
      ms_config = config_data;
    }
    if (!ms_config.qewd) {
      ms_config.qewd = {};
    }

    if (ms_config.qewd['qewd-monitor'] !== false) {
      //console.log('1 enabling qewd-monitor');
      if (ms_name) {
        linkMonitor(cwd, ms_name);
      }
      else {
        linkMonitor(cwd, '');
      }
    }
    else {
      unlinkMonitor(cwd, ms_name);
    }

  }
  else {

    // not a microservice - either native or docker monolith, or docker orchestrator

    if (config_data.orchestrator) {
      if (isDocker || service_name) {
        webServerRootPath = cwd + '/orchestrator/www/';
        //orchPath = cwd + '/orchestrator';
        //if (!fs.existsSync(orchPath)) {
        //  fs.mkdirSync(orchPath);
        //}
        serviceName = 'orchestrator';
      }
      else {
        webServerRootPath = cwd + '/www/';
        serviceName = '';
      }
      if (config_data.orchestrator['qewd-monitor'] !== false) {
        //console.log('2 enabling qewd-monitor');
        linkMonitor(cwd, serviceName);
      }
      else {
        unlinkMonitor(cwd, serviceName);
      }
    }
    else {
      if (isDocker || service_name) {
        if (config_data.microservices) {
          // this is Docker orchestrator
          webServerRootPath = cwd + '/orchestrator/www/';
          serviceName = 'orchestrator';
          //console.log('3 enabling qewd-monitor *');
          linkMonitor(cwd, serviceName);
        }
        else {
          // Docker monolith
          webServerRootPath = cwd + '/www/';
          serviceName = '';

          if (config_data['qewd-monitor'] !== false) {
            //console.log('4 enabling qewd-monitor');
            linkMonitor(cwd, serviceName);
          }
          else {
            unlinkMonitor(cwd, serviceName);
          }
        }
      }
      else {
        webServerRootPath = cwd + '/www/';
        serviceName = '';
        if (!config_data.qewd || (config_data.qewd && config_data.qewd['qewd-monitor'] !== false)) {
          //console.log('5 enabling qewd-monitor');
          linkMonitor(cwd, serviceName);
        }
        else {
          unlinkMonitor(cwd, serviceName);
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
  var helpers = {
    getBodyParser(bodyParser) {
      if (typeof bodyParser !== 'undefined' || bodyParser !== '') {
        try {
          return require(bodyParser);
        }
        catch(err) {
          return false;
        }
      }
      else {
        console.log('No bodyParser specified - use default');
        return false;
      }
    }
  };

  var default_db = 'gtm';
  if (isDocker) {
    default_db = 'dbx';
  }

  var config_template = {
    managementPassword: '=> either(qewd.managementPassword, "keepThisSecret!")',
    serverName: '=> either(qewd.serverName, "QEWD Server")',
    port: '=> either(qewd.port, 8080)',
    poolSize: '=> either(qewd.poolSize, 2)',
    database: {
      type: '=> either(qewd.database.type, default_db)',
      params: '=> either(qewd.database.params, "<!delete>")',
    },
    webServer: '{<qewd.webServer>}',
    ssl: '{<qewd.ssl>}',
    webServerRootPath: webServerRootPath,
    cors: '=> either(qewd.cors, true)',
    bodyParser: '=> getBodyParser(qewd.bodyParser)',
    mode: '=> either(qewd.mode, "production")',
    max_queue_length: '{<qewd.max_queue_length>}',
    use_worker_threads: '{<qewd.use_worker_threads>}'
  };

  var config;
  var addMiddlewarePath;

  if (ms_name) {
    config = transform(config_template, ms_config, helpers);
    addMiddlewarePath = cwd + '/' + ms_name + '/addMiddleware.js';
  }
  else {
    if (isDocker || service_name) {
      if (config_data.orchestrator) {
        config = transform(config_template, config_data.orchestrator, helpers);
      }
      else {
        config = transform(config_template, config_data, helpers);
      }
      if (config_data.microservices) {
        addMiddlewarePath = cwd + '/orchestrator/addMiddleware.js';
      }
      else {
        addMiddlewarePath = cwd + '/addMiddleware.js';
      }
    }
    else {
      config = transform(config_template, config_data, helpers);
      addMiddlewarePath = cwd + '/addMiddleware.js';
    }
  }
  if (fs.existsSync(addMiddlewarePath)) {
    config.addMiddlewareUp = require(addMiddlewarePath);
  }
  config.qewd_up = true;
  config.permit_application_switch = config_data.permit_application_switch;

  // ** set service name if running orchestrator or microservice standalone

  if (process.env.qewd_service_name) {
    config.service_name = process.env.qewd_service_name
  }
  if (process.env.mode && process.env.microservice) {
    config.service_name = process.env.microservice;
  }

  /*
  console.log('process.env.qewd_service_name = ' + process.env.qewd_service_name);
  console.log('process.env.mode = ' + process.env.mode);
  console.log('process.env.microservice = ' + process.env.microservice);
  console.log('isDocker = ' + isDocker);
  console.log('service_name = ' + service_name);
  console.log('ms_name = ' + ms_name);
  console.log('config_data = ' + JSON.stringify(config_data, null, 2));
  */

  if (isDocker || service_name) {

    if (ms_name || mode === 'microservice') {
      // This is a micro-service, not the orchestrator

      if (!mode) createModuleMap(cwd + '/' + ms_name, config);

      var routePath;
      if (ms_name && !service_name) {
        routePath = ms_config.name;
      }
      else {
        // standalone MS running in microservice mode
        //  if running integrated microservice natively, use service_name
        routePath = config_data.ms_name || mode || service_name;
      }

      routes = [{
        path: routePath,
        module: __dirname + '/ms_handlers',
        errors: {
          notfound: {
            text: 'Resource Not Recognised',
            statusCode: 404
          }
        }
      }];

      try {
        console.log('loading ' + cwd + '/configuration/routes.json');
        routes_data = require(cwd + '/configuration/routes.json');
      }
      catch(err) {
        console.log('unable to load ' + cwd + '/configuration/routes.json');
        routes_data = [];
      }

      // if this is a standalone microservice running in microservice mode,
      //  AND the imported flag has not yet been set, then add the temporary
      //  route that will accept the request from the orchestrator so the
      //  microservice's routes can be imported into the orchestrator.
      //  Also add the handler API & method for it

      if (mode === 'microservice' && !config_data.imported) {

        startupMode = 'export';

        var importRouteFound = false;
        routes_data.forEach(function(route) {
          if (route.uri === '/qewd/importRoutes/:destination') {
            importRouteFound = true;
          }
        });

        if (!importRouteFound) {
          routes_data.push({
            uri: '/qewd/importRoutes/:destination',
            method: 'POST',
            handler: 'importRoutes',
            authenticate: false,
            bypassJWTCheck: true
          });

          updateRoutes(routes_data);
        }

        var apiPath = cwd + '/apis';
        if (!fs.existsSync(apiPath)) {
          fs.mkdirSync(apiPath);
        }
        apiPath = cwd + '/apis/importRoutes';
        if (!fs.existsSync(apiPath)) {
          fs.mkdirSync(apiPath);
        }
        var cmd = 'cp ' + process.cwd() + '/node_modules/qewd/up/exportRoutesFromMs.js ' + cwd + '/apis/importRoutes/index.js';
        child_process.execSync(cmd, {stdio:[0,1,2]});
        cmd = 'cp ' + process.cwd() + '/node_modules/qewd/up/stopMSAfterExport.js ' + cwd + '/apis/importRoutes/onMSResponse.js';
        child_process.execSync(cmd, {stdio:[0,1,2]});

      }

      // dynamically create connections info from routes if not already defined in the config.json information
      routes_data.forEach(function(route) {
        if (route.from_microservices) {
          route.from_microservices.forEach(function(ms) {
            if (ms === ms_name) {
              if (route.on_microservice) {
                if (!ms_config.connections) {
                  ms_config.connections = [];
                }
                ms_config.connections.push(route.on_microservice);
              }
            }
          });
        }
      });

      if (ms_config.connections) {
        config.u_services = {
          destinations: {}
        };

        ms_config.connections.forEach(function(ms_name) {
          var index = ms_index[ms_name];
          if (typeof index !== 'undefined') {
            var ms_info = config_data.microservices[index];
            var host = ms_info.host || ms_info.name;  // default to Docker name
            if (!host.startsWith('http://') && !host.startsWith('https://')) {
              host = 'http://' + host;
            }
            var port = ms_info.port || 8080;
            if (port !== 80 && port !== 443) {
              host = host + ':' + port;
            }
            config.u_services.destinations[ms_info.name] = {
              host: host,
              application: ms_info.name
            };
          }
        });


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

    }
    else {
      // This is the orchestrator (or Docker monolith)

      // check if microservices need importing, and if so, add import route

      startupMode = addImportRoute(config_data, routes_data)

      // Add module map if necessary

      createModuleMap(cwd, config);

      // Add in microservice definitions if present

      //console.log('config_data.microservices: ' + JSON.stringify(config_data.microservices, null, 2));

      if (config_data.microservices && Array.isArray(config_data.microservices)) {
        config.u_services = {
          destinations: {},
          routes: []
        };
        var destinations = config.u_services.destinations;
        config_data.microservices.forEach(function(microservice) {

          var host;
          var port;

          if (microservice.members) {
            // group destination
            destinations[microservice.name] = {
              destinations: microservice.members
            }
          }
          else {
            // physical endpoint destination

            host = microservice.host || microservice.name;
            if (!host.startsWith('http://') && !host.startsWith('https://')) {
              host = 'http://' + host;
            }
            port = microservice.port || 8080;
            if (port !== 80 && port !== 443) {
              host = host + ':' + port;
            }

            destinations[microservice.name] = {
              host: host,
              application: microservice.name
            };
          }
        });

        routes_data.forEach(function(route) {
          var routeObj;
          var onOrchResponseFn;

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

            routeObj = {
              path: route.uri,
              method: route.method,
              destination: route.on_microservice
            };

            if (route.authenticate === false) {
              routeObj.bypassJWTCheck = true;
            }

            /*

            //var onRequestPath = cwd + '/' + route.on_microservice + '/handlers/' + route.handler + '/onRequest.js';
            var onRequestPath = cwd + '/' + route.on_microservice + '/' + route.handler + '/onRequest.js';
            console.log('Checking for onRequest path: ' + onRequestPath);
            if (fs.existsSync(onRequestPath)) {
              routeObj.onRequest = require(onRequestPath);
              console.log('Adding onRequest handler for ' + route.uri + ': ' + onRequestPath);
            }

            */

            //var onResponsePath = cwd + '/' + route.on_microservice + '/handlers/' + route.handler + '/onResponse.js';
            if (route.handler) {
              onOrchResponsePaths = [
                cwd + '/' + route.on_microservice + '/' + route.handler + '/onOrchResponse.js',
                cwd + '/' + route.on_microservice + '/apis/' + route.handler + '/onOrchResponse.js',
                cwd + '/onOrchResponse/' + route.on_microservice + '/' + route.handler + '.js'
              ];
              for (var i = 0; i < onOrchResponsePaths.length; i++) {
                console.log('checking onOrchResponsePath: ' + onOrchResponsePaths[i]);
                if (fs.existsSync(onOrchResponsePaths[i])) {
                  try {
                    onOrchResponseFn = require(onOrchResponsePaths[i]);
                    console.log('onOrchResponse handler loaded from ' + onOrchResponsePaths[i]);
                  }
                  catch(err) {
                    console.log('** Warning - onOrchResponse handler could not be loaded from ' + onOrchResponsePaths[i]);
                  }
                  break;
                }
              }
            }

            if (onOrchResponseFn) {
              routeObj.onResponse = function(args) {
                var _this = this;

                function handleResponse(obj) {
                  if (!obj.message) {
                    obj = {
                      message: obj
                    };
                  }
                  args.handleResponse.call(_this, obj);
                }

                function forwardToMS(message, callback) {
                  var msgObj = message;
                  if (!msgObj.headers) {
                    msgObj.headers = {};
                  }
                  msgObj.headers.authorization = 'Bearer ' + args.responseObj.message.token;
                  //console.log('sending ' + JSON.stringify(msgObj, null, 2));
                  var status = args.send(msgObj, callback);
                  //console.log('status = ' + status);
                  if (status === false) {
                    callback({error: 'No such route: ' + message.method + ' ' + message.path})
                  }
                }

                function getJWTProperty(name) {
                  return _this.jwt.handlers.getProperty(name, args.responseObj.message.token);
                }

                return onOrchResponseFn.call(this, args.responseObj, args.message, forwardToMS, handleResponse, getJWTProperty);
              };
            }

            config.u_services.routes.push(routeObj);
          }

          else if (route.router) {
            // dynamically-controlled routing to other API

            var onRequestPath = cwd + '/orchestrator/routers/' + route.router + '.js';
 
            routeObj = {
              path: route.uri,
              method: route.method
            };
            if (fs.existsSync(onRequestPath)) {
              routeObj.onRequest = require(onRequestPath);
              console.log('Adding onRequest handler for ' + route.uri + ': ' + onRequestPath);
            }
            config.u_services.routes.push(routeObj);
          }

        });
      }
      else {
        console.log('*** orchestrator without any microservices ***');
      }

    }

    if (!config_data.jwt || !config_data.jwt.secret) {
      config_data.jwt = {
        secret: uuid()
      };
      // write it back to cwd + '/configuration/config.json'
      fs.writeFileSync(cwd + '/configuration/config.json', JSON.stringify(config_data, null, 2));
    }
    config.jwt = Object.assign({}, config_data.jwt); // prevent it being simply by reference
  }
  else {
    // native app
    createModuleMap(cwd, config);
  }

  if (!ms_name && !mode) {

    routes_data.forEach(function(route) {
      if (route.else) return;

      var path_root = '/' + route.uri.split('/')[1];
      if (!roots[path_root]) {

        var routeObj = {
          path: path_root,
          module: __dirname + '/handlers'
        };

        //var handlerPath = cwd + '/apis';
        var handlerPath = cwd;
        //var orchestratorHandlerPath = cwd + '/orchestrator/apis';
        var orchestratorHandlerPath = cwd + '/orchestrator';
        if (fs.existsSync(orchestratorHandlerPath)) {
          handlerPath = orchestratorHandlerPath;
        }
        //var beforeRouterPath = handlerPath + path_root + '/beforeRouter.js';
        var onWSRequestPath = handlerPath + '/onWSRequest.js';
        console.log('onWSRequestPath: ' + onWSRequestPath);
        if (fs.existsSync(onWSRequestPath)) {
          routeObj.beforeRouter = [require(onWSRequestPath)];
        }

        //var afterRouterPath = handlerPath + path_root + '/afterRouter.js';
        var onWSResponsePath = handlerPath + '/onWSResponse.js';
        console.log('onWSResponsePath: ' + onWSResponsePath);
        if (fs.existsSync(onWSResponsePath)) {
          routeObj.afterRouter = [require(onWSResponsePath)];
        }

        routes.push(routeObj);
        roots[path_root] = true;
      }
    });
  }

  return {
    routes: routes,
    config: config,
    cwd: cwd,
    startupMode: startupMode
  };
}

module.exports = function(isDocker, serviceName, isNative) {

  var results = setup(isDocker, serviceName, isNative);

  console.log('** results = ' + JSON.stringify(results, null, 2));

  if (!results) return;
  var config = results.config;
  var routes = results.routes;
  var startupMode = results.startupMode;
  var cwd = results.cwd;

  //console.log('routes: ' + JSON.stringify(routes, null, 2));

  var ms_name = process.env.microservice;

  var onStartedPath;
  var onStartedPath2;

  if (ms_name) {
    onStartedPath = cwd + '/' + ms_name + '/onStarted.js';
  }
  else {
    onStartedPath = cwd + '/orchestrator/onStarted.js';
    onStartedPath2 = cwd + '/onStarted.js';
  }

  if (isDocker) {

    if (startupMode === 'export') {
      console.log('\n===============================================');
      console.log('  This QEWD-Up MicroService has started in');
      console.log('  export mode.  When the Orchestrator');
      console.log('  starts and connects to this MicroService,');
      console.log('  it will export its routes to the');
      console.log('  Orchestrator, its JWT secret will be');
      console.log('  changed to the one used by the Orchestrator');
      console.log('  and it will then shut down.');
      console.log('  ');
      console.log('  You should then restart this MicroService');
      console.log('===============================================');
      console.log(' ');
    }

    if (startupMode === 'import') {
      console.log('\n===============================================');
      console.log('  This QEWD-Up Orchestrator has started in');
      console.log('  import mode. When it connects to each');
      console.log('  MicroService, it will import its routes.');
      console.log('  When all MicroService routes are imported');
      console.log('  the Orchestrator will shut down.');
      console.log(' ');
      console.log('  You should then restart the Orchestrator');
      console.log('===============================================');
      console.log(' ');
    }

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

    if (config.database && config.database.type === 'gtm') {

      try {
        console.log('Running down YottaDB...');
        child_process.execSync(process.env.ydb_dist + '/mupip rundown -region DEFAULT', {stdio:[0,1,2]});
        child_process.execSync(process.env.ydb_dist + '/mupip rundown -region qewdreg', {stdio:[0,1,2]});
        console.log('Rundown completed');
      }
      catch(err) {
        console.log('Error running down YottaDB: ' + err);
        console.log('Recovering journal...');
        try {
          child_process.execSync(process.env.ydb_dist + '/mupip journal -recover -backward ' + process.env.ydb_dir + '/' + process.env.ydb_rel + '/g/yottadb.mjl', {stdio:[0,1,2]});
          console.log('Journal recovered');
        }
        catch(err) {
          console.log('YottaDB is probably already in use');
        }
      }
    }

    console.log('config: ' + JSON.stringify(config, null, 2));
    console.log('routes: ' + JSON.stringify(routes, null, 2));

    var q = qewd.start(config, routes);
    var xp = qewd.intercept();

    if (fs.existsSync(onStartedPath)) {
      require(onStartedPath).call(q, config, xp.app, xp.qx.router, xp.qx);
    }
    else if (fs.existsSync(onStartedPath2)) {
      require(onStartedPath2).call(q, config, xp.app, xp.qx.router, xp.qx);
    }
  }
};
