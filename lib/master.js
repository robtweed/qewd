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

  8 February 2017

   Thanks to:
    Ward De Backer for body-parser enhancement

*/

/*
// Example usage

var params = {
  managementPassword: 'keepThisSecret!',
  serverName: 'New EWD Server',
  port: 8081,
  poolSize: 1
};
var qewd = require('qewd').master;

// if you want to define REST/web service URL paths with associated routing:

var routes = [
  {
    path: '/testx' // module will default to testx.js
  },
  {
    path: '/patient',
    module: 'my-patient-module'
  }
];

var q = qewd.start(config, routes);

 // if you want to add your own user-defined objects that will be
 //  available in the worker process(es) (in the this.userDefined object):

q.userDefined['myCustomObject'] = { // your object };

*/

var express = require('express');
var bodyParser;
var qoper8 = require('ewd-qoper8');
var qx = require('ewd-qoper8-express');
var sockets = require('./sockets');
var fs = require('fs');
var util = require('util');
var app = express();

var q = new qoper8.masterProcess();
qx.addTo(q);


function start(params, routes) {
  var emptyMap = !params.moduleMap;
  var moduleMap = params.moduleMap || {};
  if (routes) {
    routes.forEach(function(route) {
      var path = route.path;
      if (path.charAt(0) === '/') {
        path = path.substring(1);
      }
      var module = route.module || path;
      moduleMap[path] = module;
      emptyMap = false;
    });
  }
  if (emptyMap) moduleMap = false;

  var config = {
    managementPassword: params.managementPassword || 'keepThisSecret',
    serverName: params.serverName || 'qewd',
    port: params.port || 8080,
    poolSize: params.poolSize || 1,
    webServerRootPath: params.webServerRootPath || process.cwd() + '/www/',
    no_sockets: params.no_sockets || false,
    qxBuild: qx.build,
    ssl: params.ssl || false,  // for ssl mode: ssl: {keyFilePath: 'xxx.key', certFilePath: 'xxx.crt'},
    cors: params.cors || false,
    masterProcessPid: process.pid,
    database: params.database,
    errorLogFile: params.errorLogFile || false,
    mode: params.mode || 'production',
    bodyParser: params.bodyParser || false, // allow the user to pass in its own bodyParser
    addMiddleware: params.addMiddleware || false, // allow the user to add custom Express middleware
    initialSessionTimeout: params.initialSessionTimeout || 300,
    sessionDocumentName: params.sessionDocumentName || 'CacheTempEWDSession',
    moduleMap: moduleMap,
    lockSession: params.lockSession || false,  // true | {timeout: 60}
    resilientMode: params.resilientMode || false,
    customSocketModule: params.customSocketModule || false
  };
  if (params.resilientMode) {
    config.resilientMode = {
      documentName: params.resilientMode.queueDocumentName || 'ewdQueue',
      keepPeriod: params.resilientMode.keepPeriod || 3600
    }
  }
  
  // if user instantiates his/her own bodyParser module, use it
  //  Note: user must then also define the app.use express middleware to use it
  if (config.bodyParser) {
    bodyParser = config.bodyParser;
  }
  else {
    bodyParser = require('body-parser');
    app.use(bodyParser.json());
    if (config.addMiddleware) config.addMiddleware(bodyParser, app, q, qx, config);
  }

  app.post('/ajax', function(req, res) {
    console.log('/ajax body: ' + JSON.stringify(req.body));
    qx.handleMessage(req, res);
  });

  console.log('webServerRootPath = ' + config.webServerRootPath);
  if (config.cors) {
    app.use('/', function (req, res, next) {
      res.header('Access-Control-Allow-Origin', '*');
      res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
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

  q.on('start', function() {
    this.worker.module = 'qewd.worker';
    //this.worker.loaderFilePath = 'node_modules/ewd-xpress/node_modules/ewd_qoper8-worker.js';
    this.setWorkerPoolSize(config.poolSize);
	
    if (params.database && params.resilientMode) {
      // connect master process to database 
      //  it will use asynch connections to save a copy of
      //  each queued request, and delete them when done
      console.log('starting resilient mode..');
      this.resilientMode = {
        documentName: config.resilientMode.documentName
      };
      var db = params.database;
      var type = db.type;

      if (type === 'cache') db.params.lock = '1';
      if (type === 'cache' || type === 'gtm' || type === 'redis') {
        console.log('connecting master process to ' + type);
        this.on('dbOpened', function() {
          if (type !== 'redis') {
            console.log(this.db.version());
          }
          else {
            this.db.version(function(version) {
              console.log(version);
            });
          }
        });
        this.on('dbClosed', function() {
          console.log('Connection to ' + db.type + ' closed');
        });
        if (type === 'redis') {
          if (!db.params) db.params = {};
          // master process must use Redis async mode (just for sets and kills)
          var redisParams = {
            host: db.params.host,
            port: db.params.port,
            integer_padding: db.params.integer_padding,
            key_separator: db.params.key_separator,
            async: true
          };
          console.log('starting ' + type + ' in master process for resilient mode: ' + JSON.stringify(redisParams));
          require('ewd-qoper8-redis')(this, redisParams);
          return;
        }
        require('ewd-qoper8-' + type)(this, db.params);
      }
    }
  });

  q.on('started', function() {
    if (!this.userDefined) this.userDefined = {};
    this.userDefined.config = config;
    var q = this;
    var io;
    var server;

    if (!config.ssl) {
      server = app.listen(config.port);
    }
    else {
      var https = require('https');
      console.log('cwd: ' + process.cwd());
      var options = {
        key: fs.readFileSync(config.ssl.keyFilePath),
        cert: fs.readFileSync(config.ssl.certFilePath)
      };
      server = https.createServer(options, app).listen(config.port);
    }
    if (!config.no_sockets) io = require('socket.io')(server);
    // load QEWD socket handling logic
    if (io) sockets(q, io, config.customSocketModule);

    q.on('response', function(messageObj) {
      // handle intermediate messages from worker (which hasn't finished)
      if (messageObj.socketId) {
        var id = messageObj.socketId;
        delete messageObj.socketId;
        delete messageObj.finished;
        io.to(id).emit('ewdjs', messageObj);
      }
    });
  });

  q.start();
  return q;
}

function intercept() {
  return {
    app: app,
    q: q,
    qx: qx
  };
}

module.exports = {
  intercept: intercept,
  start: start
};

