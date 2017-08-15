/*

 ----------------------------------------------------------------------------
 | qewd: Quick and Easy Web Development                                     |
 |                                                                          |
 | Copyright (c) 2017 M/Gateway Developments Ltd,                           |
 | Redhill, Surrey UK.                                                      |
 | All rights reserved.                                                     |
 |                                                                          |
 | http://www.mgateway.com                                                  |
 | Email: rtweed@mgateway.com                                               |
 |                                                                          |
 |                                                                          |
 | Licensed under the Apache License, Version 2.0 (the "License");          |
 | you may not use this file except in compliance with the License.         |
 | You may obtain a copy of the License at                                  |
 |                                                                          |
 |     http://www.apache.org/licenses/LICENSE-2.0                           |
 |                                                                          |
 | Unless required by applicable law or agreed to in writing, software      |
 | distributed under the License is distributed on an "AS IS" BASIS,        |
 | WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. |
 | See the License for the specific language governing permissions and      |
 |  limitations under the License.                                          |
 ----------------------------------------------------------------------------

  15 August 2017

  MicroServices Configuration Example

*/


var config = {
  managementPassword: 'keepThisSecret!',
  serverName: 'New QEWD Server',
  port: 8080,
  poolSize: 2,
  database: {
    type: 'gtm'
  },
  jwt: {
    secret: 'someSecret123'
  },

  u_services: {
    destinations: {
      rpi1_ws: {
        host: 'http://192.168.1.97:3000',
        application: 'test-app'
      },
      rpi1_rest: {
        host: 'http://192.168.1.97:3000',
        application: 'rest-login-service'
      },
      ubuntu2: {
        host: 'http://192.168.1.116:8080',
        application: 'info-service'
      },

      both_rest: {
        destinations: ['rpi1_rest', 'ubuntu2']
      }

    },
    routes: [
      {
        application: 'jwt',
        types: {
          login: {
            destination: 'rpi1_ws'
          }
        }
      },
    
      {
        path: '/api/login',
        method: 'POST',
        destination: 'rpi1_rest'
      },
      
      {
        path: '/api/:destination/info',
        method: 'GET'
      },
      
      {
        path: '/api/routingTest/:destination/info/:type'
      }
    ]
  }
};

var routes = [
  {
    path: '/api',
    module: 'jwt-rest',
    errors: {
      notfound: {
        text: 'Resource Not Recognised',
        statusCode: 404
      }
    }
  }
];

var qewd = require('qewd').master;

var q = qewd.start(config, routes);

q.on('started', function() {
  this.on('microServiceResponse', function(params) {
    console.log('****** microServiceResponse = ' + JSON.stringify(params.responseObj));
    if (params.message.path === '/api/rpi1_rest/info') {
      console.log('**** resending to ubuntu2');

      params.responseObj.message.hello = 'world';

      params.message.body.firstResponse = params.responseObj;
      params.message.path = '/api/ubuntu2/info';
      params.resend(params.message, params.handleResponse); 
    }
    else {
      params.handleResponse(params.responseObj);
    }
  });
});
