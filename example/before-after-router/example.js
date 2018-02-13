var config = {
  managementPassword: 'keepThisSecret!',
  serverName: 'QEWD development server',
  port: 8090,
  poolSize: 3,
  database: {
    type: 'cache',
    params: {
      path:"c:\\InterSystems\\Cache\\Mgr",
      //ip_address: 'localhost',
      //tcp_port: 1972,
      username: "_SYSTEM",
      password: "SYS",
      namespace: "USER"
    }
  },
  errorLogFile: 'errors.log',
  mode: 'development',
};

var js2xmlparser = require('js2xmlparser');
var parse2xml = js2xmlparser.parse ? js2xmlparser.parse : js2xmlparser;
const RateLimit = require('express-rate-limit');
const limit = new RateLimit({
  max: 5, // limit each IP to max. 30 requests per minute
  delayMs: 0 // disable delaying - full speed until the max limit is reached
});

var routes = [
  {
    path: '/api',
    module: 'testrest',
    errors: {
      notfound: {
        text: 'Resource Not Recognised',
        statusCode: 404
      }
    },
    beforeRouter: [
      limit,
      (req, res, next) => {
        console.log('$$$ beforeRouter = ' + JSON.stringify(req.params));
        next()
      }
    ],
    afterRouter: [
      (req, res, next) => {
        console.log('$$$ afterRouter = ' + JSON.stringify(req.params));
        // a response message coming back from the worker will be saved in res.locals.message by the worker handler code, so
        // let responseObj = res.locals.message;
        let responseObj = {
          "firstName": "John",
          "lastName": "Smith",
          "dateOfBirth": new Date(1964, 7, 26),
          "address": {
              "@": {
                  "type": "home"
              },
              "streetAddress": "3212 22nd St",
              "city": "Chicago",
              "state": "Illinois",
              "zip": 10000
          },
          "phone": [
              {
                  "@": {
                      "type": "home"
                  },
                  "#": "123-555-4567"
              },
              {
                  "@": {
                      "type": "cell"
                  },
                  "#": "890-555-1234"
              },
              {
                  "@": {
                      "type": "work"
                  },
                  "#": "567-555-8901"
              }
          ],
          "email": "john@smith.com"
        };
        res.set('Content-Type', 'application/xml');
        res.send(parse2xml('person', responseObj));
        next() // not needed, response already sent, only calling next() again to test middleware chain
      },
      (req, res, next) => {
        console.log('$$$ afterRouter2 = ' + JSON.stringify(req.params));
      }
    ]
  }
];

var qewd = require('qewd').master;
var q = qewd.start(config, routes);
