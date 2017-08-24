var config = {
  managementPassword: 'keepThisSecret!',
  serverName: 'QEWD Login MicroService',
  port: 8080,
  poolSize: 2,
  database: {
    type: 'gtm'
  },
  jwt: {
    secret: 'someSecret123'
  }
};

var qewd = require('qewd').master;
qewd.start(config);
