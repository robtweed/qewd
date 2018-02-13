/*

 ----------------------------------------------------------------------------
 | qewd: MicroService Start-up file for QEWD                                |
 |                                                                          |
 | Copyright (c) 2017-18 M/Gateway Developments Ltd,                        |
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

  9 February 2018

*/

var fs = require('fs');
var module_exists = require('module-exists');

var child_process = require('child_process');

function installModule(moduleName) {
  if (!module_exists(moduleName)) {
    child_process.execSync('npm install ' + moduleName, {stdio:[0,1,2]});
  }
}

var startup = require('./startup');
var userDefined = startup.userDefined;
if (!userDefined && fs.existsSync('./userDefined.json')) {
  userDefined = require('./userDefined.json');
}

var npmModules;
if (fs.existsSync('./install_modules.json')) {
  npmModules = require('./install_modules.json');
  npmModules.forEach(function(moduleName) {
    console.log('\nInstalling module ' + moduleName);
    installModule(moduleName);
    console.log('\n' + moduleName + ' installed');
  });
}

var config = startup.config;

if (!config.database) {
  config.database = {
    type: 'gtm'
  };
}

// workaround NPM5 bug

try {
  var nm = require('nodem');
}
catch(err) { 
  //var setEnv = require('ewd-qoper8-gtm/lib/setEnvironment');
  //setEnv(config.database.params);
  installModule('nodem');
}

var qewd = require('qewd').master;
console.log('Starting QEWD');

var q = qewd.start(config, startup.routes);
if (userDefined) {
  for (var name in userDefined) {
    q.userDefined[name] = userDefined[name];
  }
}
