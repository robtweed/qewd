/*

 ----------------------------------------------------------------------------
 | qewd-server: Start-up file for Dockerised version of QEWD                |
 |                                                                          |
 | Copyright (c) 2017-19 M/Gateway Developments Ltd,                        |
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

  24 January 2019

*/

var fs = require('fs');
var module_exists = require('module-exists');
var child_process = require('child_process');
var qewd = require('qewd');

function setEnv(params) {
  for (var name in params) {
    process.env[name] = params[name];
  }
}

function installModule(moduleName, modulePath) {
  if (!module_exists(moduleName) && !fs.existsSync('/opt/qewd/mapped/node_modules/' + moduleName)) {
    var prefix = '';
    if (typeof modulePath !== 'undefined') {
      prefix = ' --prefix ' + modulePath;
    }
    child_process.execSync('npm install --unsafe-perm ' + moduleName + prefix, {stdio:[0,1,2]});
    console.log('\n' + moduleName + ' installed');
  }
  else {
    console.log(moduleName + ' already installed');
  }
}

process.env.USER = 'root';
process.env.HOME = '/opt/qewd'

var startup;
var qewd_up = false;
var qewd_up_config_path = '/opt/qewd/mapped/configuration/config.json';
var qewd_up_path = '/opt/qewd/node_modules/qewd/up';

if (fs.existsSync(qewd_up_config_path)) {
  var config = require(qewd_up_config_path);
  qewd_up = (config.qewd_up === true);
}

if (qewd_up) {
  if (process.env.microservice) {
    console.log('starting up microservice ' + process.env.microservice);
    //startup = require(qewd_up_path + '/docker_ms_startup')();
    startup = require(qewd_up_path + '/run')(true);
  }
  else {
    console.log('starting up Docker Orchestrator service');
    //startup = qewd.up_run_orchestrator();
    startup = require(qewd_up_path + '/run')(true);
  }
}
else {
  startup = require('/opt/qewd/mapped/startup');
}

var userDefined = startup.userDefined;
if (!userDefined && fs.existsSync('/opt/qewd/mapped/userDefined.json')) {
  userDefined = require('/opt/qewd/mapped/userDefined.json');
}

if (userDefined && userDefined.startup_commands) {
  console.log('Running custom startup commands:');
  userDefined.startup_commands.forEach(function(cmnd) {
   console.log(cmnd);
   child_process.execSync(cmnd, {stdio:[0,1,2]});
  });
}

var npmModules;
var modulePath;
if (fs.existsSync('/opt/qewd/mapped/install_modules.json')) {
  if (!fs.existsSync('/opt/qewd/mapped/node_modules')) {
    fs.mkdirSync('/opt/qewd/mapped/node_modules');
  }

  modulePath = '/opt/qewd/mapped';
  process.env.NODE_PATH = '/opt/qewd/mapped/node_modules:' + process.env.NODE_PATH;
  require('module').Module._initPaths();

  npmModules = require('/opt/qewd/mapped/install_modules.json');
  npmModules.forEach(function(moduleName) {
    console.log('\nInstalling module ' + moduleName + ' to ' + modulePath);
    installModule(moduleName, modulePath);
  });
  console.log('** NODE_PATH = ' + process.env.NODE_PATH);
}

var config = startup.config;

// ready to start QEWD now

var qewd_master = qewd.master;
var q = qewd_master.start(config, startup.routes);

if (userDefined) {
  for (var name in userDefined) {
    q.userDefined[name] = userDefined[name];
  }
}

// invoke user-specific startup code

if (startup.onStarted) {
  startup.onStarted.call(q);
}

