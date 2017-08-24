var config = {
  managementPassword: 'keepThisSecret!',
  serverName: 'QEWD REST Server',
  port: 8080,
  poolSize: 2,
  database: {
    type: 'gtm'
  },
  jwt: {
    secret: 'someSecret123'
  }
};

var routes = [
  {
    path: '/jwt',
    module: 'myJWTRestService'
  }
];

var qewd = require('qewd').master;
qewd.start(config, routes);
