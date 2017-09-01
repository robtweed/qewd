// rename to login-micro-service.js

// Demonstrates the use of variable routes
//  see the /api/patient/:patientId/demographics route

var router = require('qewd-router');
var routes;

var patients = {
  '123456': {
    firstName: 'Rob',
    lastName: 'Tweed',
    gender: 'Male',
    country: 'UK'
  },
  '123457': {
    firstName: 'Jane',
    lastName: 'Smith',
    gender: 'Female',
    country: 'USA'
  },
};

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

function getDemographics(args, finished) {
  var patientId = args.patientId.toString();

  if (!patientId || patientId === '') {
    return finished({error: 'You must specify a patientId'});
  }

  if (!patients[patientId]) {
    return finished({error: 'Invalid patientId'});
  }
  
  finished(patients[patientId]);
}


module.exports = {
  
  init: function() {
    routes = {
      '/api/login': {
        POST: login
      },
      '/api/patient/:patientId/demographics':  {
        GET: getDemographics
      }
    };
    router.addMicroServiceHandler(routes, module.exports);
  },

  beforeMicroServiceHandler: function(req, finished) {
    // authenticate against the JWT (except for Login requests)

    if (req.path !== '/api/login') {
      return this.jwt.handlers.validateRestRequest.call(this, req, finished);
    }
  }
};
