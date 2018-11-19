var router = require('qewd-router');
var cwd = process.cwd() + '/mapped';
var ms_name = process.env.microservice;

var routes_data = require(cwd + '/configuration/routes.json');
var routes = {};

routes_data.forEach(function(route) {
  if (route.on_microservice === ms_name) {
    if (!routes[route.uri]) routes[route.uri] = {};
    routes[route.uri][route.method] =  require(cwd + '/microservices/' + ms_name + '/handlers/' + route.handler);
  }
});

console.log('routes: ' + JSON.stringify(routes, null, 2));

module.exports = {
  init: function() {
    router.addMicroServiceHandler(routes, module.exports);
  },
  beforeMicroServiceHandler: function(req, finished) {
    var authorised = this.jwt.handlers.validateRestRequest.call(this, req, finished);
    if (authorised) {
      req.qewdSession = this.qewdSessionByJWT.call(this, req);
    }
    return authorised;
  }
};
