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

  16 May 2017

   Thanks to:
    Ward De Backer for body-parser enhancement

*/

var express = require('express');
var bodyParser;
var app = express();

var qx;
var q;

function configure(config, routes, qOper8, qExt) {
  qx = qExt;
  q = qoper8;

  // if user instantiates his/her own bodyParser module, use it
  //  Note: user must then also define the app.use express middleware to use it
  if (config.bodyParser) {
    bodyParser = config.bodyParser;
  }
  else {
    bodyParser = require('body-parser');
    app.use(bodyParser.json());
    // note: config.webServer will be 'express'
    if (config.addMiddleware) config.addMiddleware(bodyParser, app, q, qx, config);
  }

  app.post('/ajax', function(req, res) {
    console.log('/ajax body: ' + JSON.stringify(req.body));
    req.headers.qewd = 'ajax';
    qx.handleMessage(req, res);
  });

  console.log('webServerRootPath = ' + config.webServerRootPath);
  if (config.cors) {
    app.use('/', function (req, res, next) {
      //res.header('Access-Control-Allow-Origin', '*');
      //res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');

      res.header('Access-Control-Allow-Credentials', 'true');
      res.header('Access-Control-Allow-Headers', 'DNT,X-CustomHeader,Keep-Alive,User-Agent,X-Requested-With,If-Modified-Since,Cache-Control,Content-Type,Authorization');
      res.header('Access-Control-Allow-Methods', 'GET, PUT, DELETE, POST, OPTIONS');
      res.header('Access-Control-Allow-Origin', '*');
      next();
    });
  }
  app.use('/', express.static(config.webServerRootPath))

  if (routes) {
    routes.forEach(function(route) {
      var path = route.path;
      app.use(path, qx.router());
      console.log('route ' + path + ' will be handled by qx.router');
    });
  }
  return app;
}

module.exports = configure;
