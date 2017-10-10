/*

 ----------------------------------------------------------------------------
 | qewd: Quick and Easy Web Development                                     |
 |                                                                          |
 | Copyright (c) 2017 M/Gateway Developments Ltd,                           |
 | Reigate, Surrey UK.                                                      |
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

  3 January 2017

  Many thanks to Ward DeBacker for help with custom router response handling

*/


var config = {
  managementPassword: 'keepThisSecret!',
  serverName: 'New QEWD Server',
  port: 8080,
  poolSize: 1,
  database: {
    type: 'cache',
    params: {
      path: '/opt/cache/mgr',
      username: '_SYSTEM',
      password: 'SYS',
      namespace: 'USER'
    }
  }
};

var qewd = require('qewd').master;

/*
  //Optional - add custom Express middleware, eg:

  // first load the intercept

  var xp = qewd.intercept();

  // now you can add your own custom routes..:

  xp.app.get('/testx', function(req, res) {
    console.log('*** /testx query: ' + JSON.stringify(req.query));
    res.send({
      hello: 'world',
      query: JSON.stringify(req.query)
    });
    // or use ewd-qoper8-express handler
    //xp.qx.handleMessage(req, res);
  });

  // or, even simpler, using ewd-qoper8-express router:

  xp.app.use('/test', xp.qx.router());

  // router + custom response handling:

  xp.app.use('/report', xp.qx.router({ nextCallback: true }), function(req, res) {
    var message = res.locals.message;
    res.set('Content-Type', 'application/xml');
    if (message.error) {
      res.send(js2xmlparser('error', message));
    }
    else {
      res.send(js2xmlparser(message.json.root || 'xmlRoot', message.json.data || {}));
    }
  });

*/


qewd.start(config);
