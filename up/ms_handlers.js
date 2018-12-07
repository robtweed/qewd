var router = require('qewd-router');
var ignore_jwt = {};
var workerResponseHandler = {};

function loadRoutes() {
  var fs = require('fs');
  var cwd = process.cwd() + '/mapped';
  var ms_name = process.env.microservice;

  var routes_data = require(cwd + '/configuration/routes.json');
  var config_data = require(cwd + '/configuration/config.json');
  var routes = {};

  console.log('loading up/ms_handlers');
  console.log('ms_name = ' + ms_name);
  console.log('routes_data = ' + JSON.stringify(routes_data, null, 2));

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
      if (!routes[route.uri]) routes[route.uri] = {};
      console.log('route.uri = ' + route.uri);
      var path = cwd + '/' + ms_source + '/handlers/';
      if (fs.existsSync(path + route.handler + '.js')) {
        handler = require(path + route.handler);
        console.log('loaded handler from ' + path + route.handler + '.js');
      }
      else {
        try {
          handler = require(path + route.handler + '/handler.js');
          console.log('loaded handler from ' + path + route.handler + '/handler.js');
        }
        catch(err) {
          handler = require(path + route.handler + '/index.js');
          console.log('loaded handler from ' + path + route.handler + '/index.js');
        }
      }

      var onHandledPath = path + route.handler + '/onHandled.js';
      if (fs.existsSync(onHandledPath)) {
        workerResponseHandler[route.uri] = require(onHandledPath);
      }

      routes[route.uri][route.method] =  handler;
      if (route.authenticate === false) {
        ignore_jwt[route.uri] = true;
      }
    }
  });

  console.log('routes: ' + JSON.stringify(routes, null, 2));
  return routes;
}

var routes = loadRoutes();

module.exports = {
  init: function() {
    router.addMicroServiceHandler(routes, module.exports);
  },
  beforeMicroServiceHandler: function(req, finished) {
    if (ignore_jwt[req.pathTemplate]) return;
    var authorised = this.jwt.handlers.validateRestRequest.call(this, req, finished);
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
          _this.microServiceRouter.call(_this, message, callback);
        }
        var jwt = message.token;
        workerResponseHandler[message.path](message, jwt, forward, send);
        return true;
      }
    }
  }
};
