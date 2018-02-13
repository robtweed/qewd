var remap = require('./remap_routes');

module.exports = function(routes, config) {

  // add afterRouter to handle redirection after Authentication by Auth0 / Gov.Verify
  //  signalled by the response containing the reserved property: qewd_redirect
  //  such responses must also define the path and name of the cookie that will hold the JWT

  for (var index = 0; index < routes.length; index++) {

    routes[index].beforeRouter = [
      (req, res, next) => {

        console.log('Incoming request: ' + req.method + ': ' + req.originalUrl);
        console.log('Incoming request - headers = ' + JSON.stringify(req.headers, null, 2));

        // original Ripple sends the QEWD Session token as a cookie header
        // copy this into a Bearer authorization header

        if (!req.headers.authorisation && req.headers.cookie) {
          if (req.headers.cookie.indexOf('JSESSIONID=') !== -1) {
            var token = req.headers.cookie.split('JSESSIONID=')[1];
            token = token.split(';')[0];
            req.headers.authorization = 'Bearer ' + token;
            delete req.headers.cookie;
          }
        }

        if (remap && remap[req.originalUrl] && remap[req.originalUrl].to && typeof remap[req.originalUrl].to === 'function') {
          req.redirectedFrom = req.originalUrl;
          req.originalUrl = remap[req.originalUrl].to(config);
          console.log('*** beforeRouter - req.redirectedFrom = ' + req.redirectedFrom);
        }
        next();
      }
    ];

    routes[index].afterRouter = [
      (req, res, next) => {

        console.log('*** afterRouter - req.redirectedFrom = ' + req.redirectedFrom + '; ' + req.originalUrl);
        // a response message coming back from the worker will be saved in res.locals.message 
        //by the worker handler code, so
        //console.log('** res.locals.message = ' + JSON.stringify(res.locals.message));
        var messageObj = res.locals.message;
        if (messageObj.qewd_redirect) {
          res.cookie(messageObj.cookieName, messageObj.token, {path: messageObj.cookiePath});
          res.redirect(messageObj.qewd_redirect);
        }
        else {

          // send message as usual

          if (messageObj.error) {
            var code = 400;
            var status = messageObj.status;
            if (status && status.code) code = status.code;
            console.log('afterRouter for ' + req.originalUrl + ' sending an error response');
            res.status(code).send(messageObj);
          }
          else {
            if (remap && remap[req.redirectedFrom] && remap[req.redirectedFrom].onResponse && typeof remap[req.redirectedFrom].onResponse === 'function') {
              console.log('remapping response for ' + req.redirectedFrom);
              messageObj = remap[req.redirectedFrom].onResponse(messageObj);
              console.log('new response: ' + JSON.stringify(messageObj));
            }
            console.log('afterRouter for ' + req.originalUrl + ' sending its response');
            res.send(messageObj);
          }
        }
      }
    ];
  }
  
  return routes;

};
