/*

 ----------------------------------------------------------------------------
 | qewd: Quick and Easy Web Development                                     |
 |                                                                          |
 | Copyright (c) 2017 M/Gateway Developments Ltd,                           |
 | Redhill, Surrey UK.                                                      |
 | All rights reserved.=|
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

  24 October 2017

*/

var fs = require('fs-extra');
var ask = require('readline-sync');

function run() {

  var pathx = require('path');

  var startFile = ask.questionPath('Startup filename: ', {
    isFile: true,
    exists: null
  });

  var fext = pathx.extname(startFile);
  var froot = pathx.basename(startFile, fext);
  var rootPath = pathx.dirname(startFile);

  var configFile = pathx.join(rootPath, froot + '_config.json');
  var routesFile = pathx.join(rootPath, froot + '_routes.json');

  var config = {
    managementPassword: 'keepThisSecret!',
    serverName: 'QEWD Server',
    port: 8080,
    poolSize: 2,
    database: {
      type: 'gtm'
    }
  };

  if (fs.existsSync(configFile)) {
    config = require(configFile);
  }

  console.log('startFile = ' + startFile);
  console.log('configFile = ' + configFile);

  console.log('config = ' + JSON.stringify(config));

  var mgtPW = ask.question('QEWD Monitor Management Password (' + config.managementPassword + '): ', {
    defaultInput: config.managementPassword
  });

  var serverName = ask.question('Server name to appear in QEWD Monitor (' + config.serverName + '): ', {
    defaultInput: config.serverName
  });

  var port = ask.questionInt('Web Server Listener Port (' + config.port + '): ', {
    defaultInput: config.port
  });

  var poolSize = ask.questionInt('Maximum Worker Pool Size (' + config.poolSize + '): ', {
    defaultInput: config.poolSize
  });

  var dbLookup = {
    'Cache': 'cache',
    'GT.M': 'gtm',
    'YottaDB': 'gtm',
    'Redis': 'redis',
  }

  var dbs = [
    'Cache',
    'GT.M',
    'YottaDB',
    'Redis'
  ];

  var dbValue = {
    cache: 1,
    gtm: 2,
    redis: 4
  };

  var dbDefault = dbValue[config.database.type];

  var dbIndex = ask.keyInSelect(dbs, 'Database: ', {
    defaultInput: dbDefault,
    cancel: false
  });

  var db = dbLookup[dbs[dbIndex]];

  var params;

  if (db === 'cache') {

    console.log('Cache-specific parameters:');

    var mgrPath = ask.questionPath('Mgr Directory Path (/opt/cache/mgr): ', {
      defaultInput: '/opt/cache/mgr'
    });

    var username = ask.question('Username (_SYSTEM): ', {
      defaultInput: '_SYSTEM'
    });

    var password = ask.question('Password (SYS): ', {
      defaultInput: 'SYS'
    });

    var namespace = ask.question('Namespace (USER): ', {
      defaultInput: 'USER'
    });

    params = {
      path: mgrPath,
      username: username,
      password: password,
      namespace: namespace
    };

  }

  var config = {
    managementPassword: mgtPW,
    serverName: serverName,
    port: port,
    poolSize: poolSize,
    database: {
      type: db,
      params: params
    }
  };

  fs.writeJsonSync(configFile, config, {spaces: 2});

  console.log('-----------------');
  console.log(' ');
  console.log('Now specify a top-level route, eg /api');

  var uri = ask.questionPath('Top-Level REST API route (/api): ', {
    defaultInput: '/api',
    exists: null
  });

  var module = ask.question('Name of module that will handle requests for this path: (test): ', {
    defaultInput: 'test'
  });

  var routes = [
    {
      path: uri,
      module: module
    }
  ];

  fs.writeJsonSync(routesFile, routes, {spaces: 2});

  var addExamples = ask.keyInYNStrict('Add a set of API examples?');

  var text = [
    "var config = require('" + configFile + "');",
    "var routes = require('" + routesFile + "');",
    "var qewd = require('qewd').master;",
    "qewd.start(config, routes);"
  ];

  fs.outputFileSync(startFile, text.join('\n'));

  var packageJsonFile = pathx.join(rootPath, 'node_modules', module, 'package.json');

  var package = {
    name: module,
    version: '1.0.0',
    main: 'index.js'
  };

  fs.outputJsonSync(packageJsonFile, package, {spaces: 2});

  text = [
    "var router = require('qewd-router');",
    "var routes = require('./routeModule');",
    "module.exports = {",
    "  restModule: true,",
    "  init: function() {",
    "    routes = router.initialise(routes, module.exports);",
    "  }",
    "};"
  ]

  var indexFile = pathx.join(rootPath, 'node_modules', module, 'index.js');
  fs.outputFileSync(indexFile, text.join('\n'));

  text = [
    "var routeDef = require('./routes.json');",
    "var routes = [];",
    "routeDef.forEach(function(route) {",
    "  route.handler = require('./handlers/' + route.use);",
    "  delete route.use;",
    "   routes.push(route);",
    "});",
    "module.exports = routes;"
  ];

  var routeFile = pathx.join(rootPath, 'node_modules', module, 'routeModule.js');
  fs.outputFileSync(routeFile, text.join('\n'));

  var routes = [
    {
      path: '/api/test/:input',
      method: 'GET',
      use: 'test_get'
    }
  ];

  text = [
    "module.exports = function(args, finished) {",
    "  finished({test_get: 'Ran OK', args: args});",
    "};"
  ];

  var handlerFile = pathx.join(rootPath, 'node_modules', module, 'handlers', 'test_get.js');
  fs.outputFileSync(handlerFile, text.join('\n'));

  if (addExamples) {

    routes.push({
      path: '/api/test',
      method: 'POST',
      use: 'test_post'
    });

    text = [
      "module.exports = function(args, finished) {",
      "  finished({test_post: 'Ran OK', args: args});",
      "};"
    ];

    var handlerFile = pathx.join(rootPath, 'node_modules', module, 'handlers', 'test_post.js');
    fs.outputFileSync(handlerFile, text.join('\n'));

  }

  routeFile = pathx.join(rootPath, 'node_modules', module, 'routes.json');
  fs.outputJsonSync(routeFile, routes, {spaces: 2});

}

run();

