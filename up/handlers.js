console.log('running up/handlers.js in process ' + process.pid);

var ignorePaths = {};
var beforeHandlerFn;
var errorResponse;

function getRoutes() {
  var fs = require('fs');
  var cwd = process.cwd();

  // check if running in Docker container
  if (fs.existsSync(cwd + '/mapped')) cwd = cwd + '/mapped';

  var routes_data = require(cwd + '/configuration/routes.json');
  var routes = [];
  var isConductor = false;
  var handlerRootPath = cwd + '/handlers';
  var orchestratorHandlerPath = cwd + '/orchestrator/handlers';
  if (fs.existsSync(orchestratorHandlerPath)) {
    handlerRootPath = orchestratorHandlerPath;
    isConductor = true;
    console.log(111111);
  }
  console.log('handlerRootPath = ' + handlerRootPath);

  routes_data.forEach(function(route) {
    //console.log('** route = ' + JSON.stringify(route));
    if (route.else) {
      errorResponse = route.else;
      return;
    }
    if (isConductor && route.on_microservice) return;  // ignore microservice routes
    var path_root = '/' + route.uri.split('/')[1];
    var handler;
    var handlerPath = handlerRootPath + path_root + '/' + route.handler;
    if (fs.existsSync(handlerPath + '/handler.js')) {
      handler = require(handlerPath + '/handler.js');
      console.log('loaded handler from ' + handlerPath + '/handler.js');
    }
    else {
      handler = require(handlerPath);
      console.log('loaded handler from ' + handlerPath);
    }
    var routeObj = {
      url: route.uri,
      method: route.method,
      handler: handler
    };

    var onRequestPath = handlerPath + '/onRequest.js';
    console.log('onRequestPath: ' + onRequestPath);
    if (fs.existsSync(onRequestPath)) {
      routeObj.onRequest = require(onRequestPath);
    }

    routes.push(routeObj);
    if (route.applyBeforeHandler === false) {
      ignorePaths[route.uri] = true;
    }

  });

  var beforeHandlerPath = handlerRootPath + '/beforeHandler.js';
  console.log('beforeHandlerPath: ' + beforeHandlerPath);
  if (fs.existsSync(beforeHandlerPath)) {
    beforeHandlerFn = require(beforeHandlerPath);
  }

  console.log('routes: ' + JSON.stringify(routes, null, 2));
  return routes;
}

function beforeHandler(req, finished) {
  if (!beforeHandlerFn) return;
  if (ignorePaths[req.path]) return;
  beforeHandlerFn(req, finished);
}

module.exports = {
  restModule: true,
  init: function(application) {
    var router = require('qewd-router');
    var routes = getRoutes();
    routes = router.initialise(routes, module.exports);
    if (errorResponse) {
      var statusCode = errorResponse.statusCode || 404;
      var text = errorResponse.text || 'Not Found';
      router.setErrorResponse(statusCode, text);
      this.setCustomErrorResponse.call(this, {
        application: application,
        errorType: 'noTypeHandler',
        text: text,
        statusCode: statusCode
      });
    }
  },
  beforeHandler: beforeHandler
};
