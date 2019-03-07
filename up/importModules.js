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

  7 March 2019

*/

var fs = require('fs');

function updateConfig(json) {
  fs.writeFileSync('/opt/qewd/mapped/configuration/config.json', JSON.stringify(json, null, 2));
}

function updateRoutes(json) {
  fs.writeFileSync('/opt/qewd/mapped/configuration/routes.json', JSON.stringify(json, null, 2));
}

function tidyUp(config_data, mapped) {
  //console.log('tidying up');
  config_data.microservices.forEach(function(ms, index) {
    //console.log('tidying up ' + ms.name);
    // reset flags for all microservices that have been successfully mapped
    if (mapped[ms.name]) {
      //console.log('mapped');
      config_data.microservices[index].apis.imported = true;
    }
  });
  updateConfig(config_data);
}

function removeImportRoute(routesByUri) {
  var routes = [];
  var route;
  for (var uri in routesByUri) {
    route = routesByUri[uri];
    if (route.uri !== '/qewd/importRoutes/:destination') {
      routes.push(route);
    }
  }
  updateRoutes(routes);
}

module.exports = function(jwt) {

  var config_data;
  try {
    config_data = require('/opt/qewd/mapped/configuration/config.json');
  }
  catch(err) {
    config_data = {};
  }

  if (!config_data.qewd_up) {
    return;
  }

  //console.log('** config_data = ' + JSON.stringify(config_data, null, 2));
  var routes;
  try {
    routes = require('/opt/qewd/mapped/configuration/routes.json');
    // tidy up just in case of previous problems
    removeImportRoute(routes);
  }
  catch(err) {
    routes = [];
  }

  var ms;
  var on_microservices = [];
  var replacePathPrefixes = {};
  var routesByUri = {};

  routes.forEach(function(route) {
    routesByUri[route.uri] = route;
  });

  config_data.microservices.forEach(function(ms) {
    if (ms.apis && ms.apis.import && !ms.apis.imported) {
      // this microservice needs to be imported
      on_microservices.push(ms.name);
      if (ms.apis.path && ms.apis.path.replacePrefixWith) {
        replacePathPrefixes[ms.name] = ms.apis.path.replacePrefixWith;
      }
    }
  });

  if (on_microservices.length > 0) {

    // note: temporary route to allow import of microservice routes
    // has already been added in run.js

    var message = {
      type: 'ewd-qoper8-express',
      method: 'POST',
      jwt: jwt,
      body: {
        secret: this.userDefined.config.jwt.secret
      }
    };
    var _this = this;
    var mapped = {};
    var noOfMs = on_microservices.length;
    var count = 0;

    on_microservices.forEach(function(ms_name) {
      message.path = '/qewd/importRoutes/' + ms_name;
      if (replacePathPrefixes[ms_name]) {
        message.body.pathPrefix = replacePathPrefixes[ms_name];
      }
      //console.log('message: ' + JSON.stringify(message, null, 2));
      _this.microServiceRouter(message, function(responseObj) {
        //console.log('importRoutes response: ' + JSON.stringify(responseObj, null, 2));
        if (!responseObj.error) {
          // map microservice routes back into routes.json

          var ms_name = responseObj.message.ms_name;
          if (responseObj.message && responseObj.message.routes) {
            responseObj.message.routes.forEach(function(route) {
              // reset path if needed ***
              // check if this is a duplicate route for another microservice, in which
              // case on_microservice needs replacing with on_microservices array

              if (replacePathPrefixes[ms_name]) {
                var pieces = route.uri.split('/');
                pieces[1] = replacePathPrefixes[ms_name];
                route.uri = pieces.join('/');
              }
              if (routesByUri[route.uri]) {
                if (!routesByUri[route.uri].on_microservice && !routesByUri[route.uri].on_microservices) {
                  routesByUri[route.uri].on_microservice = ms_name;
                }
                if (routesByUri[route.uri].on_microservice && !routesByUri[route.uri].on_microservices) {
                  routesByUri[route.uri].on_microservices = [
                    routesByUri[route.uri].on_microservice,
                    ms_name
                  ];
                  delete routesByUri[route.uri].on_microservice;
                }
                if (routesByUri[route.uri].on_microservices) {
                  routesByUri[route.uri].on_microservices.push(ms_name);
                }
              }
              else {
                route.on_microservice = ms_name;
              }
              routesByUri[route.uri] = route;
            });
          }

          mapped[ms_name] = true;
        }
        else {
          console.log('** An error occurred while importing MicroService APIs: ' + responseObj.error);
        }
        count++;
        if (count === noOfMs) {
          tidyUp(config_data, mapped);
          removeImportRoute(routesByUri)
          // shut down Orchestrator - must restart to use imported MicroServices
          _this.stop();
        }
      });
    });
  }
};
