var router = require('qewd-router');
var routes;

function search(args, finished) {
  console.log('*** search args: ' + JSON.stringify(args, null, 2));
  args.session.ranSearchAt = Date.now();
  var username = args.session.username;
  var jwt = this.jwt.handlers.setJWT.call(this, args.session);

  finished({
    test: 'finished ok',
    username: username,
    token: jwt
  });
}



var headings = {
  allergies: true,
  medications: true
};

function getSummary(args, finished) {
  if (headings[args.heading]) {
    finished({
      patient: args.patientId,
      heading: args.heading,
      summary: 'details would be here'
    });
  }
  else {
    finished({
      error: 'Invalid heading ' + args.heading,
      status: {
        code: 401
      }

    });
  }
}

function save(args, finished) {
  var doc = this.db.use('myData');
  var ix = doc.increment();
  doc.$(ix).setDocument(args.req.body);
  finished({saved: ix});
}

function login(args, finished) {
  var username = args.req.body.username;
  if (!username || username === '') {
    return finished({error: 'You must provide a username'});
  }
  var password = args.req.body.password;
  if (!password || password === '') {
    return finished({error: 'You must provide a password'});
  }
  if (username !== 'rob') return finished({error: 'Invalid username'});
  if (password !== 'secret') return finished({error: 'Invalid password'});
  var session = this.jwt.handlers.createRestSession.call(this, args);
  session.welcomeText = 'Welcome ' + username;
  session.username = username;
  session.makeSecret('username');
  session.authenticated = true;
  session.timeout = 1200;
  var jwt = this.jwt.handlers.setJWT.call(this, session);

  finished({token: jwt});
}




module.exports = {
  restModule: true,

 beforeHandler: function(req, finished) {
    if (req.path !== '/api/login') {
      return this.jwt.handlers.validateRestRequest.call(this, req, finished);
    }
  },

  init: function(application) {
    routes = [
      {
        url: '/api/search',
        method: 'GET',
        handler: search
      },
      {
        url: '/api/patient/:patientId/:heading/summary',
        method: 'GET',
        handler: getSummary
      },
      {
        url: '/api/save',
        method: 'POST',
        handler: save
      },
      {
        url: '/api/login',
        method: 'POST',
        handler: login
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
