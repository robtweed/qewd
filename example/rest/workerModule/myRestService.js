var router = require('qewd-router');
var routes;

function search(args, finished) {
  finished({
    test: 'finished ok',
    username: args.session.data.$('username').value
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
  
  var session = this.sessions.create('testWebService', 3600);
  session.authenticated = true;
  session.data.$('username').value = username;
  finished({token: session.token});
}



module.exports = {
  restModule: true,

 beforeHandler: function(req, finished) {
    if (req.path !== '/api/login') {
      return this.sessions.authenticateRestRequest(req, finished);
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
