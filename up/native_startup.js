/*

 ----------------------------------------------------------------------------
 | qewd-up: Start-up file for microservices running QEWD natively           |
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

  5 July 2019

*/

var fs = require('fs');
var module_exists = require('module-exists');
var child_process = require('child_process');
var qewd = require('qewd');


const gtm_version =  'V6.3-005';
const ydb_versionp = 'r1.24';
const ydb_version =  'r124';
const ydb_arch =     'x86_64';
const updateScriptName = 'update_r122_to_r124';

function setEnv(params) {
  for (var name in params) {
    process.env[name] = params[name];
  }
}

function installModule(moduleName) {
  var pieces = moduleName.split('@');
  var rootName;
  if (moduleName.startsWith('@')) {
    rootName = '@' + pieces[1];
  }
  else {
    rootName = pieces[0];
  }
  if (!module_exists(rootName) && !fs.existsSync(rootName)) {
    var prefix = '';
    child_process.execSync('npm install --unsafe-perm ' + moduleName + prefix, {stdio:[0,1,2]});
    console.log('\n' + moduleName + ' installed');
  }
  else {
    console.log(moduleName + ' already installed');
  }
}

var startup;
var qewd_up = false;

console.log('*** loading ' + __dirname + '/' + 'configuration/config.json');

var qewd_up_config_path = __dirname + '/' + 'configuration/config.json';

//process.chdir(__dirname);

var qewd_up_path = 'qewd/up';

if (fs.existsSync(qewd_up_config_path)) {
  var config = require(qewd_up_config_path);
  qewd_up = (config.qewd_up === true);
  console.log('** config = ' + JSON.stringify(config, null, 2));
  if (config.ms_name) {
    process.env.microservice = config.ms_name;
    process.env.mode = 'microservice';
  }
}


installModule('qewd-transform-json');

if (qewd_up) {
  if (process.argv[3] && process.argv[3] !== '') {
    process.env.microservice = process.argv[3];
  }
  if (process.env.microservice) {
    console.log('starting up microservice ' + process.env.microservice);
    //startup = require(qewd_up_path + '/docker_ms_startup')();
    startup = require(qewd_up_path + '/run')(false, process.argv[2]);
  }
  else {
    console.log('starting up Orchestrator service');
    process.env.qewd_service_name = process.argv[2];
    startup = require(qewd_up_path + '/run')(false, process.argv[2]);
  }
  if (!startup) {
    console.log('QEWD has started');
    return;
  }
}
else {
  startup = require('./startup');
}

var userDefined = startup.userDefined;
if (!userDefined && fs.existsSync('./userDefined.json')) {
  userDefined = require('./userDefined.json');
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
if (fs.existsSync('./install_modules.json')) {

  npmModules = require('./install_modules.json');
  npmModules.forEach(function(moduleName) {
    console.log('\nInstalling module ' + moduleName);
    installModule(moduleName);
  });
}

var config = startup.config;

if (!config.database) {
  config.database = {
    type: 'gtm'
  };
}
else if (!config.database.type) {
  config.database.type = 'gtm';
}

/*

if (config.database && config.database.type === 'gtm') {

  // rundown the default region database (all globals except CacheTempEWDSession)
  //  it may return an error, so wrap in a try/catch

  var ydb_dir = processs.env.ydb_dir;
  var ydb_path = processs.env.ydb_rel;

  try {
    console.log('Running down YottaDB...');
    child_process.execSync('mupip rundown -region DEFAULT', {stdio:[0,1,2]});
    child_process.execSync('mupip set -key_size=1019 -region DEFAULT', {stdio:[0,1,2]});
    child_process.execSync('mupip set -record_size=1048576 -region DEFAULT', {stdio:[0,1,2]});
    child_process.execSync('mupip rundown -region qewdreg', {stdio:[0,1,2]});
    child_process.execSync('mupip set -key_size=1019 -region qewdreg', {stdio:[0,1,2]});
    child_process.execSync('mupip set -record_size=1048576 -region qewdreg', {stdio:[0,1,2]});
    console.log('Rundown completed');
  }
  catch(err) {
    console.log('Error running down YottaDB: ' + err);
    console.log('Recovering journal...');
    child_process.execSync('/mupip journal -recover -backward ' + ydb_dir + '/' + ydb_path + '/g/yottadb.mjl', {stdio:[0,1,2]});
    console.log('Journal recovered');
  }

  // update database journal file if it's for an old version

  try {
    child_process.execSync('/mupip journal -show=header -backward ' + ydb_dir + '/' + ydb_path + '/g/yottadb.mjl', {stdio:[0,1,2]});
  }
  catch(err) {
    // journal file is for previous YDB version - replace it with new version
    var updateScript = './' + updateScriptName;
    child_process.execSync(updateScript, {stdio:[0,1,2]});
  }

}

*/

// ready to start QEWD now

var qewd_master = qewd.master;
console.log('Starting QEWD');

var q = qewd_master.start(config, startup.routes);
if (userDefined) {
  for (var name in userDefined) {
    q.userDefined[name] = userDefined[name];
  }
}

if (q.userDefined && q.userDefined.config) {
  q.userDefined.config.qewd_up = qewd_up;
}

var xp = qewd_master.intercept();

// invoke user-specific startup code

if (startup.onStarted) {
  startup.onStarted.call(q, config, xp.app, xp.qx.router, xp.qx);
}

