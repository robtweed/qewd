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

  10 February 2019

*/

var router = require('qewd-router');
var ignore_jwt = {};
var workerResponseHandler = {};
var onWorkerLoad;
var beforeHandler;

function loadRoutes(onHandledOnly) {
  var fs = require('fs');
  var cwd = process.cwd() + '/mapped';
  var ms_name = process.env.microservice;
  var ms_path = cwd + '/' + ms_name + '/';

  var routes_data = require(cwd + '/configuration/routes.json');
  var config_data = require(cwd + '/configuration/config.json');
  var routes = {};

  console.log('loading up/ms_handlers in process ' + process.pid);
  console.log('ms_name = ' + ms_name);
  //console.log('routes_data = ' + JSON.stringify(routes_data, null, 2));

  // check for any grouped destinations that include this microservice name

  var group_matches = {};
  config_data.microservices.forEach(function(microservice) {
    if (microservice.members) {
      microservice.members.forEach(function(member_name) {
        if (member_name === ms_name) {
          group_matches[microservice.name] = true;
        }
      });
    }
  });

  routes_data.forEach(function(route) {
    var handler;
    var onMSResponsePath;
    var ms_match = false;
    var ms_source = ms_name;

    if (route.on_microservice) {
      if (route.on_microservice === ms_name) {
        // direct match
        ms_match = true;
      }
      if (group_matches[route.on_microservice]) {
        // group destination match
        ms_match = true;
        if (route.handler_source) {
          ms_source = route.handler_source;
        }
      }
    }
    if (!ms_match && route.on_microservices) {
      route.on_microservices.forEach(function(on_ms_name) {
        if (on_ms_name === ms_name) ms_match = true;
        if (route.handler_source) {
          ms_source = route.handler_source;
        }
      });
    }

    if (ms_match) {
      if (onHandledOnly) {
        onMSResponsePath = ms_path + route.handler + '/onMSResponse.js';
        if (fs.existsSync(onMSResponsePath)) {
          workerResponseHandler[route.uri] = require(onMSResponsePath);
        }
      }
      else {
        if (!routes[route.uri]) routes[route.uri] = {};
        console.log('route.uri = ' + route.uri);
        var path = cwd + '/' + ms_source + '/';
        var handlerPaths = [
          path + route.handler + '.js',
          path + route.handler + '/handler.js',
          path + route.handler + '/index.js',
          path + 'apis/' + route.handler + '/index.js'
        ];
        var handlerFound = false;
        for (var i = 0; i < handlerPaths.length; i++) {
          if (fs.existsSync(handlerPaths[i])) {
            try {
              handler = require(handlerPaths[i]);
              console.log('loaded handler from ' + handlerPaths[i]);
            }
            catch(err) {
              console.log('*** Warning - handler for ' + route.handler + ' found but could not be loaded from ' + handlerPaths[i]);
              console.log(err);
            }
            handlerFound = true;
            break;
          }
        }
        if (!handlerFound) {
          console.log('*** Warning - handler for ' + route.handler + ' not found');
        }

        routes[route.uri][route.method] =  handler;
        if (route.authenticate === false) {
          ignore_jwt[route.uri] = true;
        }
      }
    }
  });

  if (onHandledOnly) return;

  var onWorkerLoadPath = ms_path + 'onWorkerLoad.js';
  if (fs.existsSync(onWorkerLoadPath)) {
    onWorkerLoad = require(onWorkerLoadPath);
    console.log('Loaded onWorkerLoad module from ' + onWorkerLoadPath);
  }

  var beforeHandlerPath = ms_path + 'beforeHandler.js';
  if (fs.existsSync(beforeHandlerPath)) {
    beforeHandler = require(beforeHandlerPath);
    console.log('Loaded beforeHandler module from ' + beforeHandlerPath);
  }

  console.log('routes: ' + JSON.stringify(routes, null, 2));
  return routes;
}

loadRoutes(true); // when called by master process for workerResponseHandlers
                  // to prevent unnecessary loading of route handlers
 

module.exports = {
  init: function() {
    var routes = loadRoutes();
    if (onWorkerLoad) {
      onWorkerLoad.call(this);
    }
    router.addMicroServiceHandler(routes, module.exports);
  },
  beforeMicroServiceHandler: function(req, finished) {
    if (ignore_jwt[req.pathTemplate]) return;
    var authorised = this.jwt.handlers.validateRestRequest.call(this, req, finished);
    if (authorised && beforeHandler) {
      return beforeHandler.call(this, req, finished);
    }
    return authorised;
  },
  workerResponseHandlers: {
    restRequest: function(message, send) {
      if (workerResponseHandler[message.path]) {
        var _this = this;
        function forward(message, jwt, callback) {
          message.headers = {
            authorization: 'Bearer ' + jwt
          };
          return _this.microServiceRouter.call(_this, message, callback);
        }
        var jwt = message.token;
        var status = workerResponseHandler[message.path].call(this, message, jwt, forward, send);
        if (typeof status === 'undefined') return true;
        if (status === false) return;
        return status;
      }
    }
  }
};
