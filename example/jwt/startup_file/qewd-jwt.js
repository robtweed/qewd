/*

 ----------------------------------------------------------------------------
 | qewd: Quick and Easy Web Development                                     |
 |                                                                          |
 | Copyright (c) 2023 MGateway Ltd,                                         |
 | Banstead, Surrey UK.                                                     |
 | All rights reserved.                                                     |
 |                                                                          |
 | https://www.mgateway.com                                                 |
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

  3 January 2017


  Example QEWD startup that does 2 things:

  1) Configures QEWD to support JWTs
  2) Defines a micro-service

     all incoming requests for an application named "jwt" with a type of "login"
     will be routed to a QEWD micro-service system at 192.168.1.97:3000.  The
     application on the micro-service platform that handles this request type is
     "test-app"

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
  u_services: [
    {
      application: 'jwt',
      types: {
        login: {
          url: 'http://192.168.1.97:3000',
          application: 'test-app'
        }
      }
    }
  ]
};

var qewd = require('qewd').master;
qewd.start(config);
