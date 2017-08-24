var router = require('qewd-router');
var routes;

function login(args, finished) {
  var username = args.req.body.username;
  var password = args.req.body.password;
  var session = args.session;
  if (username === 'rob' && password === 'secret') {
    session.userText = 'Welcome Rob';
    session.username = username;
    session.authenticated = true;
    session.timeout = 1200;

    session.makeSecret('username');
    session.makeSecret('authenticated');

    return finished({ok: true});
  }
  else {
    return finished({error: 'Invalid login'});
  }
}

module.exports = {
  
  init: function() {
    routes = {
      '/api/login': {
        POST: login
      }
    };
    router.addMicroServiceHandler(routes, module.exports);
  }
};
