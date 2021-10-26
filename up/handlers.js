/*

 ----------------------------------------------------------------------------
 | qewd-up: Rapid QEWD API Development                                      |
 |                                                                          |
 | Copyright (c) 2018-19 M/Gateway Developments Ltd,                        |
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

  4 July 2019

*/

console.log('running up/handlers.js in process ' + process.pid);

var createDocStoreEvents = require('./createDocStoreEvents');
var handleDocStoreEvents = require('./handleDocStoreEvents');

var ignorePaths = {};
var beforeHandlerFn;
var errorResponse;
var onWorkerLoad;
var docStoreEventsArr;
var docStoreEvents;

function getRoutes() {
  var fs = require('fs');
  var cwd = process.cwd();

  // check if running in Docker container
  if (fs.existsSync(cwd + '/mapped')) cwd = cwd + '/mapped';
  if (process.env.qewd_service_name) {
    cwd = cwd + '/' + process.env.qewd_service_name;
  }

  var routes_data = require(cwd + '/configuration/routes.json');
  var routes = [];
  //var isConductor = false;
  var handlerRootPath = cwd + '/apis';
  var orchestratorHandlerPath = cwd + '/orchestrator/apis';
  if (fs.existsSync(orchestratorHandlerPath)) {
    handlerRootPath = orchestratorHandlerPath;
    //isConductor = true;
  }
  console.log('handlerRootPath = ' + handlerRootPath);

  routes_data.forEach(function(route) {
    console.log('** route = ' + JSON.stringify(route));
    if (route.router) {
      console.log('dynamically routed');
      // dynamically-routed, so this isn't to be loaded into the Worker
      return;
    }
    if (route.else) {
      errorResponse = route.else;
      return;
    }
    //if (isConductor && route.on_microservice) return;  // ignore microservice routes
    if (route.on_microservice) return;  // ignore microservice routes
    //var path_root = '/' + route.uri.split('/')[1];
    var path_root = '';
    var handler;
    var ms_source = handlerRootPath;
    if (route.handler_source) {
      ms_source = cwd + '/' + route.handler_source;
    }
    var handlerPath = ms_source + '/' + route.handler;
    var handlerPaths = [
      handlerPath + '/handler.js',
      handlerPath
    ];
    var handlerFound = false;
    for (var i = 0; i < handlerPaths.length; i++) {
      if (fs.existsSync(handlerPaths[i])) {
        try {
          handler = require(handlerPaths[i]);
          console.log('loaded handler from ' + handlerPaths[i]);
        }
        catch(err) {
          console.log('** Warning - unable to load handler from ' + handlerPaths[i] + ': ');
          console.log(err);
        }
        handlerFound = true;
        break;
      }
    }
    if (!handlerFound) {
      console.log('** Warning: unable to find handler module for ' + route.handler);
    }

    var routeObj = {
      url: route.uri,
      method: route.method,
      handler: handler
    };

    var onRequestPath = handlerPath + '/onRequest.js';
    console.log('onRequestPath: ' + onRequestPath);
    if (fs.existsSync(onRequestPath)) {
      routeObj.onRequest = require(onRequestPath);
    }

    routes.push(routeObj);
    if (route.applyBeforeHandler === false) {
      ignorePaths[route.uri] = true;
    }

  });

  var onWorkerLoadPath = cwd + '/onWorkerLoad.js';
  if (fs.existsSync(onWorkerLoadPath)) {
    try {
      onWorkerLoad = require(onWorkerLoadPath);
      console.log('Loaded onWorkerLoad module from ' + onWorkerLoadPath);
    }
    catch(err) {
      console.log('** Warning - unable to load onWorkerLoad module from ' + onWorkerLoadPath);
    }
  }
  else {
    onWorkerLoadPath = cwd + '/apis/onWorkerLoad.js';
    if (fs.existsSync(onWorkerLoadPath)) {
      try {
        onWorkerLoad = require(onWorkerLoadPath);
        console.log('Loaded onWorkerLoad module from ' + onWorkerLoadPath);
      }
      catch(err) {
        console.log('** Warning - unable to load onWorkerLoad module from ' + onWorkerLoadPath);
      }
    }
  }

  var beforeHandlerPath = handlerRootPath + '/beforeHandler.js';
  console.log('beforeHandlerPath: ' + beforeHandlerPath);

  if (fs.existsSync(beforeHandlerPath)) {
    try {
      beforeHandlerFn = require(beforeHandlerPath);
      console.log('Loaded beforeHandler module from ' + beforeHandlerPath);
    }
    catch(err) {
      console.log('** Warning - unable to load ' + beforeHandlerPath);
    }
  }

  console.log('Loading ' + cwd + '/docStoreEvents/events.json');
  var docStoreEventsPath = cwd + '/docStoreEvents/events.json';
  if (fs.existsSync(docStoreEventsPath)) {
    docStoreEvents = createDocStoreEvents(docStoreEventsPath, cwd);
  }

  //console.log('routes: ' + JSON.stringify(routes, null, 2));
  return routes;
}

function beforeHandler(req, finished) {
  if (!beforeHandlerFn) return;
  if (ignorePaths[req.path]) return;
  return beforeHandlerFn.call(this, req, finished);
}

module.exports = {
  restModule: true,
  init: function(application) {
    var _this = this;
    var router = require('qewd-router');
    var routes = getRoutes();
	console.log('Faisal:');
	console.log(routes);
    routes = router.initialise(routes, module.exports);
	console.log('Faisal2:');
	console.log(routes);
    if (errorResponse) {
      var statusCode = errorResponse.statusCode || 404;
      var text = errorResponse.text || 'Not Found';
      router.setErrorResponse(statusCode, text);
      this.setCustomErrorResponse.call(this, {
        application: application,
        errorType: 'noTypeHandler',
        text: text,
        statusCode: statusCode
      });
    }

    if (onWorkerLoad) {
      onWorkerLoad.call(this);
    }

    if (docStoreEvents) {
      handleDocStoreEvents.call(this, docStoreEvents);
    }

  },
  beforeHandler: function(req, finished) {
    return beforeHandler.call(this, req, finished);
  }
};
