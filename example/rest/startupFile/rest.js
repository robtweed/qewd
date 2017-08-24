var config = {
  managementPassword: 'keepThisSecret!',
  serverName: 'My QEWD Server',
  port: 8080,
  poolSize: 2,
  database: {
    type: 'gtm'
  }
};

var routes = [
  {
    path: '/api',
    module: 'myRestService'
  }
];

var qewd = require('qewd').master;
qewd.start(config, routes);
