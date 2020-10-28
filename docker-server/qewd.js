/*

 ----------------------------------------------------------------------------
 | qewd-server: Start-up file for Dockerised version of QEWD                |
 |                                                                          |
 | Copyright (c) 2017-20 M/Gateway Developments Ltd,                        |
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

  24 October 2020

*/

var fs = require('fs');
var module_exists = require('module-exists');
var child_process = require('child_process');
var qewd = require('qewd');

const gtm_version =  'V6.3-008';
const ydb_versionp = 'r1.30';
const ydb_version =  'r130';
const ydb_arch =     'x86_64';
const updateScriptName = 'update_to_r130';

function setEnv(params) {
  for (var name in params) {
    process.env[name] = params[name];
  }
}

function installModule(moduleName, modulePath) {
  var pieces = moduleName.split('@');
  var rootName;
  if (moduleName.startsWith('@')) {
    rootName = '@' + pieces[1];
  }
  else {
    rootName = pieces[0];
  }
  if (!module_exists(rootName) && !fs.existsSync('/opt/qewd/mapped/node_modules/' + rootName)) {
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
process.env.HOME = '/opt/qewd';
if (!process.env.NODE_PATH) {
  process.env.NODE_PATH = '/opt/qewd/mapped/modules';
}

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
  if (!startup) {
    console.log('Unable to start QEWD');
    return;
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
  if (!process.env.NODE_PATH.includes('/opt/qewd/mapped/node_modules:')) {
    process.env.NODE_PATH = '/opt/qewd/mapped/node_modules:' + process.env.NODE_PATH;
  }
  require('module').Module._initPaths();

  npmModules = require('/opt/qewd/mapped/install_modules.json');
  npmModules.forEach(function(moduleName) {
    console.log('\nInstalling module ' + moduleName + ' to ' + modulePath);
    installModule(moduleName, modulePath);
  });
  console.log('** NODE_PATH = ' + process.env.NODE_PATH);
}

var config = startup.config;

var ydb_default_params = {
  database: 'YottaDB',
  release: ydb_versionp,
  architecture: ydb_arch.split('_')[0],
  multithreaded: false
};

if (!config.database) {
  config.database = {
    type: 'dbx',
    params: ydb_default_params
  };
}
if (!config.database.type) {
  config.database.type = 'dbx';
}
if (config.database.type === 'dbx' && !config.database.params) {
  config.database.params = ydb_default_params;
}

// shortened name for QEWD Session global, for maximum subscript length tolerance

config.sessionDocumentName = 'qs';

if (config.database && (config.database.type === 'gtm' || (config.database.type === 'dbx' && config.database.params.database === 'YottaDB'))) {

  // Define YottaDB Environment Variables for Worker Processes

  console.log('Setting up YottaDB Environment');

  var ydb_path = ydb_versionp + '_' + ydb_arch;
  var gtm_path = gtm_version + '_' + ydb_arch;
  var ydb_env = {
    ydb_retention: 42,
    gtm_retention: 42,
    LD_LIBRARY_PATH: '/usr/local/lib/yottadb/' + ydb_version,
    ydb_log: '/tmp/yottadb/' + ydb_path,
    gtm_log: '/tmp/yottadb/' + ydb_path,
    gtm_repl_instance: '/root/.yottadb/' + ydb_path + '/g/yottadb.repl',
    ydb_repl_instance: '/root/.yottadb/' + ydb_path + '/g/yottadb.repl',
    ydb_gbldir: '/root/.yottadb/' + ydb_path + '/g/yottadb.gld',
    ydb_etrap: 'Write:(0=$STACK) "Error occurred: ",$ZStatus,!',
    ydb_dir: '/root/.yottadb',
    gtmver: gtm_path,
    ydb_rel: ydb_path,
    gtmgbldir: '/root/.yottadb/' + ydb_path + '/g/yottadb.gld',
    ydb_routines: '/root/.yottadb/' + ydb_path + '/o*(/root/.yottadb/' + ydb_path + '/r /root/.yottadb/r) /usr/local/lib/yottadb/' + ydb_version + '/libyottadbutil.so',
    gtmroutines: '/root/.yottadb/' + ydb_path + '/o*(/root/.yottadb/' + ydb_path + '/r /root/.yottadb/r) /usr/local/lib/yottadb/' + ydb_version + '/libyottadbutil.so',
    gtmdir: '/root/.fis-gtm',
    gtm_etrap: 'Write:(0=$STACK) "Error occurred: ",$ZStatus,!',
    ydb_tmp: '/tmp/yottadb/' + ydb_path,
    gtm_tmp: '/tmp/yottadb/' + ydb_path,
    gtm_dist: '/usr/local/lib/yottadb/' + ydb_version,
    ydb_dist: '/usr/local/lib/yottadb/' + ydb_version
  };

  setEnv(ydb_env);

  if (config.database.type === 'gtm') {
    config.database = {
      type: 'gtm',
      params:{
        ydb_env: ydb_env
      }
    };

    /*

    // workaround NPM5 bug

    try {
      var nm = require('nodem');
    }
    catch(err) { 
      installModule('nodem');
    }
    */
  }

  // rundown the default region database (all globals except CacheTempEWDSession)
  //  it may return an error, so wrap in a try/catch

  // also max out the allowed global subscript and data length

  try {
    console.log('Running down YottaDB...');
    child_process.execSync(ydb_env.ydb_dist + '/mupip rundown -region DEFAULT', {stdio:[0,1,2]});
    child_process.execSync(ydb_env.ydb_dist + '/mupip rundown -region qewdreg', {stdio:[0,1,2]});
    console.log('Rundown completed');
  }
  catch(err) {
    console.log('Error running down YottaDB: ' + err);
    console.log('Recovering journal...');
    child_process.execSync(ydb_env.ydb_dist + '/mupip journal -recover -backward /root/.yottadb/' + ydb_path + '/g/yottadb.mjl', {stdio:[0,1,2]});
    console.log('Journal recovered');
  }

  try {
    console.log('Max out the global subscript and data lengths');
    child_process.execSync(ydb_env.ydb_dist + '/mupip set -key_size=1019 -region DEFAULT', {stdio:[0,1,2]});
    child_process.execSync(ydb_env.ydb_dist + '/mupip set -record_size=1048576 -region DEFAULT', {stdio:[0,1,2]});
    child_process.execSync(ydb_env.ydb_dist + '/mupip set -key_size=1019 -region qewdreg', {stdio:[0,1,2]});
    child_process.execSync(ydb_env.ydb_dist + '/mupip set -record_size=1048576 -region qewdreg', {stdio:[0,1,2]});
  }
  catch(err) {
    console.log('Unable to increase subscript and global lengths');
  }

  // update database journal file if it's for an old version

  try {
    child_process.execSync(ydb_env.ydb_dist + '/mupip journal -show=header -backward /root/.yottadb/' + ydb_path + '/g/yottadb.mjl', {stdio:[0,1,2]});
  }
  catch(err) {
    // journal file is for previous YDB version - replace it with new version
    var updateScript = '/opt/qewd/' + updateScriptName;
    child_process.execSync(updateScript, {stdio:[0,1,2]});
  }

  child_process.execSync('service xinetd start', {stdio:[0,1,2]});

}

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

