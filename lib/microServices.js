/*

 ----------------------------------------------------------------------------
 | qewd: Quick and Easy Web Development                                     |
 |                                                                          |
 | Copyright (c) 2017 M/Gateway Developments Ltd,                           |
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

  6 September 2017

  Run during master process startup (see master.js)
  Sets up MicroService connections and control data structues 
  as defined in the QEWD startup file

*/

var qewdSocketClient = require('./socketClient');
var router = require('qewd-router');

var count = 0;
var noOfClients = 0;

function addClient(url, application, startParams) {
  console.log('Adding MicroService Client connection: url = ' + url + '; application = ' + application);
  var q = this;
  if (!this.u_services.clients[url]) {
    this.u_services.clients[url] = new qewdSocketClient();
    startParams[url] = {
      url: url,
      application: application,
      log: true,
      jwt: this.jwt
    };
    this.u_services.clients[url].on('ewd-registered', function() {
      console.log(url + ' micro-service ready');

      // save registration token (needed for REST micro-service paths

      q.u_services.clients[url].token = this.token;

      /*
      count++;
      if (count === noOfClients) {
        // all microservice connections are in place and started, so start QEWD
        q.start();
      }
      */
    });
    noOfClients++;
  }
  return this.u_services.clients[url];
}

module.exports = function(services_config) {

  console.log('Setting up micro-service connections');
  // set up micro-service connections
  var application;
  var path;
  var type;
  var serviceType;
  var url;
  var client;
  var startParams = {};

  this.u_services = {
    clients: {},
    byApplication: {},
    byPath: {},
    restRoutes: [],
    byDestination: {}
  };

  var q = this;

  if (!services_config.destinations && !services_config.routes) {
    var routes = services_config.slice(0); // clone the routes array
    services_config = {
      destinations: {},
      routes: routes
    };
  }

  var destObj;
  var client;
  for (var destination in services_config.destinations) {
    destObj = services_config.destinations[destination];
    if (destObj.application && destObj.host) {
      client = addClient.call(q, destObj.host, destObj.application, startParams);
      destObj.client = client;
    }
    q.u_services.byDestination[destination] = destObj;
  }

  services_config.routes.forEach(function(service) {

    var path = service.path;

    if (path) {
      // Rest Microservice routes - we'll handle these using qewd-router

      var route = {
        pathTemplate: path,
        destination: service.destination,
        method: service.method,
        onResponse: service.onResponse,
        route: new router.routeParser(service.path)
      };

      if (service.onRequest) {
        route.onRequest = service.onRequest;
        delete route.destination; // onRequest function will determine the destination
        delete route.onResponse;  // onRequest's responsibility is to route to a destination which may have an onResponse
      }

      q.u_services.restRoutes.push(route);

      // make qewd-router accessible to ewd-qoper8-express which will handle the run-time routing
      if (!q.router) q.router = router; 
    }
    else {

      // QEWD WebSocket Application MicroService routes

      application = service.application;
      if (application && !q.u_services.byApplication[application]) {
        q.u_services.byApplication[application] = {};
      }
      for (type in service.types) {
        //console.log('**** type = ' + type);
        serviceType = service.types[type];

        // route defined with host url and application, or with destination

        if (serviceType.url && serviceType.application) {
          client = addClient.call(q, serviceType.url, serviceType.application, startParams);
          q.u_services.byApplication[application][type] = {
            application: serviceType.application,
            type: type,
            client: client
          };
        }
        else if (serviceType.destination && services_config.destinations[serviceType.destination]) {
          client = q.u_services.clients[services_config.destinations[serviceType.destination].host];
          q.u_services.byApplication[application][type] = {
            application: services_config.destinations[serviceType.destination].application,
            type: type,
            client: client
          };
        }
      }
    }
  });

  // now start up the socket connections to the remote micro-socket servers

  // only when these connections are in place will this QEWD instance start

  for (url in this.u_services.clients) {
    console.log('starting microService connection to ' + url);
    this.u_services.clients[url].start(startParams[url]);
  }

  //console.log('u_services by application: ' + JSON.stringify(q.u_services.byApplication));

};
