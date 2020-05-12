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

  12 May 2020

*/

var fs = require('fs');
var rootPath = '/opt/qewd/mapped/';

function updateConfig(json) {
  fs.writeFileSync(rootPath + 'configuration/config.json', JSON.stringify(json, null, 2));
}

function updateRoutes(json) {
  fs.writeFileSync(rootPath + 'configuration/routes.json', JSON.stringify(json, null, 2));
}

function setMsToImported(ms_name) {
  var _this = this;
  this.importMode.config_data.microservices.forEach(function(ms, index) {
    // reset flags for all microservices that have been successfully mapped
    if (ms.name === ms_name) {
      _this.importMode.config_data.microservices[index].apis.imported = true;
    }
  });
  updateConfig(this.importMode.config_data);
  var routes = [];
  for (var uri in this.importMode.routesByUri) {
    routes.push(this.importMode.routesByUri[uri]);
  }
  updateRoutes(routes);
}

function orchShouldStop() {
  var shouldStop = true;
  this.importMode.config_data.microservices.forEach(function(ms) {
    if (ms.apis && ms.apis.import && !ms.apis.imported) {
      shouldStop = false;
    }
  });

  if (shouldStop) {
    updateConfig(this.importMode.config_data);
    var routes = [];
    for (var uri in this.importMode.routesByUri) {
      if (uri !== 'POST:/qewd/importRoutes/:destination') {
        routes.push(this.importMode.routesByUri[uri]);
      }
    }
    updateRoutes(routes);
  }

  return shouldStop;
}

function removePreviousMSRoutes(ms_name) {

  var route;
  for (var uri in this.importMode.routesByUri) {
    route = this.importMode.routesByUri[uri];
    if (route.on_microservice !== ms_name) {
      if (route.on_microservices) {
        var routeClone = Object.assign({}, route);
        var msArr = route.on_microservices.slice(0);
        var ix = msArr.indexOf(ms_name);
        if (ix !== -1) {
          msArr.splice(ix, 1);
          if (msArr.length === 1) {
            delete routeClone.on_microservices;
            routeClone.on_microservice = msArr[0];
          }
          if (msArr.length > 1) {
            routeClone.on_microservices = msArr;
          }
          if (msArr.length > 0) {
            this.importMode.routesByUri[uri] = routeClone;
          }
        }
      }
    }
    else {
      delete this.importMode.routesByUri[uri];
    }
  }
}

module.exports = function(ms_name, jwt) {

  if (!this.userDefined.config.qewd_up) {
    //console.log('*** this.userDefined.config.qewd_up is not set, so no further action');
    return;
  }

  if (!this.importMode) {
    this.importMode = {};
  }

  var routes;
  var _this = this;

  rootPath = '/opt/qewd/mapped/';
  if (process.env.qewd_service_name) {
    if (process.env.qewd_isNative) {
      rootPath = process.cwd() + '/';
    }
    else {
      rootPath = process.cwd() + '/' + process.env.qewd_service_name + '/';
    }
  }

  if (!this.importMode.config_data) {
    try {
      this.importMode.config_data = require(rootPath + 'configuration/config.json');
    }
    catch(err) {
      this.importMode.config_data = {};
    }
    try {
      routes = require(rootPath + 'configuration/routes.json');
    }
    catch(err) {
      routes = [];
    }

    this.importMode.routesByUri = {};
    routes.forEach(function(route) {
      if (route.uri !== '/qewd/importRoutes/:destination') {
        _this.importMode.routesByUri[route.method + ':' + route.uri] = route;
      }
    });
  }

  var ms;
  var import_ms = false;
  var replacePaths = {};
  var microservices = this.importMode.config_data.microservices;

  for (var i = 0; i < microservices.length; i++) {
    ms = microservices[i];
    if (ms.name === ms_name) {
      if (ms.apis && ms.apis.import && !ms.apis.imported) {
        import_ms = true;
        // this microservice needs to be imported
        if (ms.apis.path) {
          if (ms.apis.path.replacePrefixWith) {
            replacePaths.prefix = ms.apis.path.replacePrefixWith;
          }
          if (ms.apis.path.prependWith) {
            replacePaths.prepend = ms.apis.path.prependWith;
          }
        }
      }
    }
  }

  if (import_ms) {

    // This microservice is flagged for import but has not yet been imported

    // This might be a re-import for this microservice, so remove any
    // previously added routes for this microservice

    removePreviousMSRoutes.call(this, ms_name);

    //console.log(JSON.stringify(this.importMode.routesByUri, null, 2));

    // note: temporary route to allow import of microservice routes
    // has already been added in run.js

    var message = {
      type: 'ewd-qoper8-express',
      method: 'POST',
      path: '/qewd/importRoutes/' + ms_name,
      jwt: jwt,
      body: {
        secret: this.userDefined.config.jwt.secret,
        pathPrefix: replacePaths.prefix,
        pathPrepend: replacePaths.prepend
      }
    };

    this.microServiceRouter(message, function(responseObj) {
      //console.log('importRoutes response: ' + JSON.stringify(responseObj, null, 2));
      if (!responseObj.error) {
        // map microservice routes back into routes.json

        var ms_name = responseObj.message.ms_name;
        if (responseObj.message && responseObj.message.routes) {
          var routesByUri = _this.importMode.routesByUri;

          responseObj.message.routes.forEach(function(route) {
            // reset path if needed ***
            // check if this is a duplicate route for another microservice, in which
            // case on_microservice needs replacing with on_microservices array

            if (replacePaths.prefix) {
              var pieces = route.uri.split('/');
              pieces[1] = replacePaths.prefix;
              route.uri = pieces.join('/');
            }
            if (replacePaths.prepend) {
              var prepend = replacePaths.prepend;
              if (prepend[0] !== '/') {
                prepend = '/' + prepend;
              }
              route.uri = prepend + route.uri;
            }
            var routeIndex = route.method + ':' + route.uri;
            if (routesByUri[routeIndex]) {
              if (!routesByUri[routeIndex].on_microservice && !routesByUri[routeIndex].on_microservices) {
                routesByUri[routeIndex].on_microservice = ms_name;
              }
              if (routesByUri[routeIndex].on_microservice && !routesByUri[routeIndex].on_microservices) {
                routesByUri[routeIndex].on_microservices = [
                  ms_name
                ];
                delete routesByUri[routeIndex].on_microservice;
              }
              if (routesByUri[routeIndex].on_microservices) {
                if (routesByUri[routeIndex].on_microservices.indexOf(ms_name) === -1) {
                  routesByUri[routeIndex].on_microservices.push(ms_name);
                }
              }
            }
            else {
              route.on_microservice = ms_name;
            }
            routesByUri[routeIndex] = route;
          });
        }

        setMsToImported.call(_this, ms_name);
        if (orchShouldStop.call(_this)) {
          // all microservices flagged for import have been imported
          _this.stop();
        }
      }
      else {
        console.log('** An error occurred while importing MicroService APIs: ' + responseObj.error);
      }

    });
  }
};
