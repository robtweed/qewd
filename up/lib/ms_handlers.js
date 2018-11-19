var router = require('qewd-router');
var cwd = process.cwd() + '/mapped';
var ms_name = process.env.microservice;

var routes_data = require(cwd + '/configuration/routes.json');
var routes = {};

console.log('loading up/lib/ms_handlers');
console.log('ms_name = ' + ms_name);
console.log('routes_data = ' + JSON.stringify(routes_data, null, 2));

var ignore_jwt = {};

routes_data.forEach(function(route) {
  if (route.on_microservice === ms_name) {
    if (!routes[route.uri]) routes[route.uri] = {};
    console.log('route.uri = ' + route.uri);
    var path = cwd + '/microservices/' + ms_name + '/handlers/';
    console.log('path: ' + path + '; handler = ' + route.handler + '; method: ' + route.method);
    routes[route.uri][route.method] =  require(path + route.handler);
    if (route.authenticate === false) {
      ignore_jwt[route.uri] = true;
    }
  }
});

console.log('routes: ' + JSON.stringify(routes, null, 2));

module.exports = {
  init: function() {
    router.addMicroServiceHandler(routes, module.exports);
  },
  beforeMicroServiceHandler: function(req, finished) {
    if (ignore_jwt[req.pathTemplate]) return;
    var authorised = this.jwt.handlers.validateRestRequest.call(this, req, finished);
    return authorised;
  }
};
