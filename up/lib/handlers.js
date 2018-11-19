console.log('loading up/lib/handlers');

var fs = require('fs');
var cwd = process.cwd();

// check if running in Docker container
if (fs.existsSync(cwd + '/mapped')) cwd = cwd + '/mapped';

var routes_data = require(cwd + '/configuration/routes.json');
var router = require('qewd-router');
var routes = [];

routes_data.forEach(function(route) {
  if (route.on_microservice) return;

  var path_root = '/' + route.uri.split('/')[1];
  routes.push({
    url: route.uri,
    method: route.method,
    handler: require(cwd + '/handlers' + path_root + '/' + route.handler)
  });
});

console.log('routes: ' + JSON.stringify(routes, null, 2));

module.exports = {
  restModule: true,
  init: function() {
    routes = router.initialise(routes, module.exports);
  },
  beforeHandler: function(req, finished) {
  }
};
