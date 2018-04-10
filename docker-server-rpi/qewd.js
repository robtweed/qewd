/*

 ----------------------------------------------------------------------------
 | qewd-server: Start-up file for Dockerised version of QEWD                |
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

  6 April 2018

*/

var fs = require('fs');
var module_exists = require('module-exists');

var child_process = require('child_process');

function setEnv(params) {
  for (var name in params) {
    process.env[name] = params[name];
  }
}

function installModule(moduleName) {
  if (!module_exists(moduleName)) {
    child_process.execSync('npm install ' + moduleName, {stdio:[0,1,2]});
  }
}

var startup = require('/opt/qewd/mapped/startup');
var userDefined = startup.userDefined;
if (!userDefined && fs.existsSync('/opt/qewd/mapped/userDefined.json')) {
  userDefined = require('/opt/qewd/mapped/userDefined.json');
}

var npmModules;
if (fs.existsSync('/opt/qewd/mapped/install_modules.json')) {
  npmModules = require('/opt/qewd/mapped/install_modules.json');
  npmModules.forEach(function(moduleName) {
    console.log('\nInstalling module ' + moduleName);
    installModule(moduleName);
    console.log('\n' + moduleName + ' installed');
  });
}

// Define YottaDB Environment Variables for Worker Processes

console.log('Setting up YottaDB Environment');

var config = startup.config;

config.database = {
  type: 'gtm',
  params:{
    ydb_env: {
      ydb_retention: 42,
      gtm_retention: 42,
      LD_LIBRARY_PATH: '/usr/local/lib/yottadb/r120',
      ydb_log: '/tmp/yottadb/r1.20_armv7l',
      gtm_log: '/tmp/yottadb/r1.20_armv7l',
      gtm_repl_instance: '/root/.yottadb/r1.20_armv7l/g/yottadb.repl',
      ydb_repl_instance: '/root/.yottadb/r1.20_armv7l/g/yottadb.repl',
      ydb_gbldir: '/root/.yottadb/r1.20_armv7l/g/yottadb.gld',
      ydb_etrap: 'Write:(0=$STACK) "Error occurred: ",$ZStatus,!',
      ydb_dir: '/root/.yottadb',
      gtmver: 'V6.3-003A_armv7l',
      ydb_rel: 'r1.20_armv7l',
      gtmgbldir: '/root/.yottadb/r1.20_armv7l/g/yottadb.gld',
      ydb_routines: '/root/.yottadb/r1.20_armv7l/o*(/root/.yottadb/r1.20_armv7l/r /root/.yottadb/r) /usr/local/lib/yottadb/r120/libyottadbutil.so',
      gtmroutines: '/opt/qewd/node_modules/nodem/src /root/.yottadb/r1.20_armv7l/o*(/root/.yottadb/r1.20_armv7l/r /root/.yottadb/r) /usr/local/lib/yottadb/r120/libyottadbutil.so',
      GTMCI: '/opt/qewd/node_modules/nodem/resources/nodem.ci',
      gtmdir: '/root/.fis-gtm',
      gtm_etrap: 'Write:(0=$STACK) "Error occurred: ",$ZStatus,!',
      ydb_tmp: '/tmp/yottadb/r1.20_armv7l',
      gtm_tmp: '/tmp/yottadb/r1.20_armv7l',
      gtm_dist: '/usr/local/lib/yottadb/r120',
      ydb_dist: '/usr/local/lib/yottadb/r120'
    }
  }
};


// workaround NPM5 bug

try {
  var nm = require('nodem');
}
catch(err) { 
  setEnv(config.database.params.ydb_env);
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
if (startup.onStarted) {
  startup.onStarted.call(q);
}



