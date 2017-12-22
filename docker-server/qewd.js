/*

 ----------------------------------------------------------------------------
 | qewd-server: Start-up file for Dockerised version of QEWD                |
 |                                                                          |
 | Copyright (c) 2017 M/Gateway Developments Ltd,                           |
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

  22 December 2017

*/

var fs = require('fs');
var module_exists = require('module-exists');

var child_process = require('child_process');

function installModule(moduleName) {
  if (!module_exists(moduleName)) {
    child_process.execSync('npm install ' + moduleName, {stdio:[0,1,2]});
  }
}

var startup = require('/opt/qewd/mapped/startup');
var userDefined;
if (fs.existsSync('/opt/qewd/mapped/userDefined.json')) {
  userDefined = require('/opt/qewd/mapped/userDefined.json');
}

var npmModules;
if (fs.existsSync('/opt/qewd/mapped/install_modules.json')) {
  npmModules = require('/opt/qewd/mapped/install_modules.json');
  npmModules.forEach(function(moduleName) {
    installModule(moduleName);
  });
}

// Define YottaDB Environment Variables for Worker Processes

var yotta_release = 'r110';
var gtmdir = '/root/.fis-gtm';
var gtmver = fs.readdirSync(gtmdir)[0];
var gtmver2 = fs.readdirSync('/usr/lib/yottadb')[0];
var gtmroot = gtmdir + '/' + gtmver;
var gtmroutines = '/opt/qewd/node_modules/nodem/src /root/.fis-gtm/' + gtmver + '/o*(/root/.fis-gtm/' + gtmver + '/r /root/.fis-gtm/r) /usr/local/lib/yottadb/' + yotta_release + '/plugin/o(/usr/local/lib/yottadb/' + yotta_release + '/plugin/r) /usr/local/lib/yottadb/' + yotta_release + '/libgtmutil.so /usr/local/lib/yottadb/' + yotta_release;

var config = startup.config;

config.database = {
  type: 'gtm',
  params:{
    gtmdir: gtmdir,
    gtmver: gtmver,
    gtmver2: gtmver2,
    gtmdist: '/usr/local/lib/yottadb/' + yotta_release,
    gtmrep: 'off',
    GTMCI: '/opt/qewd/node_modules/nodem/resources/nodem.ci',
    gtmgbldir: gtmroot + '/g/gtm.gld',
    gtmroutines: gtmroutines
  }
};

var qewd = require('qewd').master;
var q = qewd.start(config, startup.routes);
if (userDefined) {
  for (var name in userDefined) {
    q.userDefined[name] = userDefined[name];
  }
}


