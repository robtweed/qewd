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

  20 June 2018

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

if (userDefined && userDefined.startup_commands) {
  console.log('Running custom startup commands:');
  userDefined.startup_commands.forEach(function(cmnd) {
   console.log(cmnd);
   child_process.execSync(cmnd, {stdio:[0,1,2]});
  });
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
      LD_LIBRARY_PATH: '/usr/local/lib/yottadb/r122',
      ydb_log: '/tmp/yottadb/r1.22_x86_64',
      gtm_log: '/tmp/yottadb/r1.22_x86_64',
      gtm_repl_instance: '/root/.yottadb/r1.22_x86_64/g/yottadb.repl',
      ydb_repl_instance: '/root/.yottadb/r1.22_x86_64/g/yottadb.repl',
      ydb_gbldir: '/root/.yottadb/r1.22_x86_64/g/yottadb.gld',
      ydb_etrap: 'Write:(0=$STACK) "Error occurred: ",$ZStatus,!',
      ydb_dir: '/root/.yottadb',
      gtmver: 'V6.3-004_x86_64',
      ydb_rel: 'r1.22_x86_64',
      gtmgbldir: '/root/.yottadb/r1.22_x86_64/g/yottadb.gld',
      ydb_routines: '/opt/qewd/node_modules/nodem/src /root/.yottadb/r1.22_x86_64/o*(/root/.yottadb/r1.22_x86_64/r /root/.yottadb/r) /usr/local/lib/yottadb/r122/libyottadbutil.so',
      gtmroutines: '/opt/qewd/node_modules/nodem/src /root/.yottadb/r1.22_x86_64/o*(/root/.yottadb/r1.22_x86_64/r /root/.yottadb/r) /usr/local/lib/yottadb/r122/libyottadbutil.so',
      GTMCI: '/opt/qewd/node_modules/nodem/resources/nodem.ci',
      ydb_ci: '/opt/qewd/node_modules/nodem/resources/nodem.ci',
      gtmdir: '/root/.fis-gtm',
      gtm_etrap: 'Write:(0=$STACK) "Error occurred: ",$ZStatus,!',
      ydb_tmp: '/tmp/yottadb/r1.22_x86_64',
      gtm_tmp: '/tmp/yottadb/r1.22_x86_64',
      gtm_dist: '/usr/local/lib/yottadb/r122',
      ydb_dist: '/usr/local/lib/yottadb/r122'
    }
  }
};


setEnv(config.database.params.ydb_env);

// workaround NPM5 bug

try {
  var nm = require('nodem');
}
catch(err) { 
  installModule('nodem');
}

// rundown the default region database (all globals except CacheTempEWDSession)
//  it may return an error, so wrap in a try/catch

try {
  console.log('Running down YottaDB...');
  child_process.execSync(config.database.params.ydb_env.ydb_dist + '/mupip rundown -region DEFAULT', {stdio:[0,1,2]});
  child_process.execSync(config.database.params.ydb_env.ydb_dist + '/mupip rundown -region qewdreg', {stdio:[0,1,2]});
  //child_process.execSync(config.database.params.ydb_env.ydb_dist + '/mupip rundown -region "*"', {stdio:[0,1,2]});
  console.log('Rundown completed');
}
catch(err) {
  console.log('Error running down YottaDB: ' + err);
  console.log('Recovering journal...');
  child_process.execSync(config.database.params.ydb_env.ydb_dist + '/mupip journal -recover -backward /root/.yottadb/r1.22_x86_64/g/yottadb.mjl', {stdio:[0,1,2]});
  console.log('Journal recovered');

}

// ready to start QEWD now

var qewd = require('qewd').master;
console.log('Starting QEWD');

var q = qewd.start(config, startup.routes);

if (userDefined) {
  for (var name in userDefined) {
    q.userDefined[name] = userDefined[name];
  }
}

// invoke user-specific startup code

if (startup.onStarted) {
  startup.onStarted.call(q);
}



