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

*/


var config = {
  managementPassword: 'keepThisSecret!',
  serverName: 'New QEWD Server',
  port: 8080,
  poolSize: 1,
  database: {
    type: 'gtm'
  }
};

var qewd = require('qewd').master;

/*
  Optiional - add custom Express middleware, eg:

  var xp = qewd.intercept();


  xp.app.get('/testx', function(req, res) {
    console.log('*** /testx query: ' + JSON.stringify(req.query));
    res.send({
      hello: 'world',
      query: JSON.stringify(req.query)
    });
    // or use ewd-qoper8-express handler
    //xp.qx.handleMessage(req, res);
  });
*/


qewd.start(config);
