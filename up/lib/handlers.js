var routes_data = require(process.cwd() + '/configuration/routes.json');
var router = require('qewd-router');
var routes = [];

routes_data.forEach(function(route) {
  var path_root = '/' + route.uri.split('/')[1];
  routes.push({
    url: route.uri,
    method: route.method,
    handler: require(process.cwd() + '/handlers' + path_root + '/' + route.handler)
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
