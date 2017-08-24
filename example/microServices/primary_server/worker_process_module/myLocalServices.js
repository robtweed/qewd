var router = require('qewd-router');
var routes;

function info(args, finished) {
  args.session.ranInfoAt = Date.now();
  var username = args.session.username;
  console.log('*** info args: ' + JSON.stringify(args, null, 2));
  var jwt = this.jwt.handlers.setJWT.call(this, args.session);

  finished({
    info: {
      server: 'ubuntu119',
      loggedInAs: username,
      arch: process.arch,
      platform: process.platform,
      versions: process.versions,
      memory: process.memoryUsage()
    },
    token: jwt
  });
}


module.exports = {
  restModule: true,

  beforeHandler: function(req, finished) {
    return this.jwt.handlers.validateRestRequest.call(this, req, finished);
 },

 init: function(application) {
    routes = [
      {
        url: '/api/info',
        method: 'GET',
        handler: info
      }
    ] 
    routes = router.initialise(routes, module.exports);
    router.setErrorResponse(404, 'Not Found');
    this.setCustomErrorResponse.call(this, {
      application: application,
      errorType: 'noTypeHandler',
      text: 'Resource Not Found',
      statusCode: '404'
    });


  }
};
