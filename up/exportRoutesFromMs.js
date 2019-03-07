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

  // will be moved during startup to /apis/importRoutes/index.js
  // if config.json shows imported as false
  //  and if running in import mode

var routes = require('/opt/qewd/mapped/configuration/routes.json');
var config = require('/opt/qewd/mapped/configuration/config.json');
var fs = require('fs');

function updateConfig(json) {
  fs.writeFileSync('/opt/qewd/mapped/configuration/config.json', JSON.stringify(json, null, 2));
}

function isEmpty(obj) {
  for (var name in obj) {
    return false;
  }
  return true;
}

function updateRoutes(json) {
  fs.writeFileSync('/opt/qewd/mapped/configuration/routes.json', JSON.stringify(json, null, 2));
}

module.exports = function(args, finished) {

  for (var i = 0; i < routes.length; i++) {
    if (routes[i].uri === '/qewd/importRoutes/:destination') {
      routes.splice(i, 1);
      break;
    }
  }

  // update the JWT secret with the one from the Orchestrator

  config.jwt = {
    secret: args.req.body.secret
  };

  // flag this microservice as imported to prevent this happening next restart

  config.imported = true;

  if (isEmpty(config.qewd)) {
    delete config.qewd;
  };

  updateConfig(config);

  // replace routes with importRoutes route and
  //  on_microservice properties removed

  var routes_data = routes.slice(); // clone the array
  var newRoutes = [];
  var pathPrefix = args.req.body.pathPrefix;
  routes_data.forEach(function(route, index) {
    if (route.on_microservice === config.ms_name) {
      delete routes_data[index].on_microservice;
    }
    // create additional versions using the path prefix sent from orchestrator (if present)
    if (pathPrefix) {
      var newRoute = Object.assign({}, route);
      var pieces = newRoute.uri.split('/');
      pieces[1] = pathPrefix;
      newRoute.uri = pieces.join('/');
      newRoutes.push(newRoute); 
    }
  });
  

  updateRoutes(routes_data.concat(newRoutes));

  finished({
    routes: routes,
    ms_name: config.ms_name
  });
};
