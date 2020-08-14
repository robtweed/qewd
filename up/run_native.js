/*

 ----------------------------------------------------------------------------
 | qewd-up: Rapid QEWD API Development                                      |
 |                                                                          |
 | Copyright (c) 2018-20 M/Gateway Developments Ltd,                        |
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

  14 August 2020

*/

const dbx_github_url = {
  v12: "https://raw.githubusercontent.com/chrisemunt/mg-dbx/master/bin/winx64/node12/mg-dbx.node",
  v14: "https://raw.githubusercontent.com/chrisemunt/mg-dbx/master/bin/winx64/node14/mg-dbx.node"
};
const dbx_node_file = 'node_modules/mg-dbx.node';
const qm_adminui_path = 'www/qewd-monitor-adminui';
const qm_adminui_qewd_apps_path = 'qewd-apps/qewd-monitor-adminui';
const www_path = 'www';
const components_path = 'www/components';
const qewd_client_path = 'www/qewd-client.js';
const mgWebComponents_path = 'www/mg-webComponents.js';

const mgWebComponents_url = 'https://raw.githubusercontent.com/robtweed/mg-webComponents/master/mg-webComponents.js';
const qewd_client_url = 'https://raw.githubusercontent.com/robtweed/qewd-client/master/qewd-client.js';
const qm_adminui_url = 'https://github.com/robtweed/qewd-monitor-adminui';

const wc_adminui_url = 'https://github.com/robtweed/wc-admin-ui';
const wc_leaflet_url = 'https://github.com/robtweed/wc-leaflet';
const wc_d3_url = 'https://github.com/robtweed/wc-d3';

const fs = require('fs-extra');
const run_qewd = require('./run');
const git_clone = require('./git_clone');
const https = require('https');

let file;
let request;
let url;
let path;

function exit_process() {
  console.log('\n*** Installation Completed.  QEWD will halt ***');
  console.log('*** Please restart QEWD again using "npm start" \n');
  process.exit();
}

if (!fs.existsSync(www_path)) {
  fs.mkdirSync(www_path);
}

if (!fs.existsSync(mgWebComponents_path)) {
  let file1 = fs.createWriteStream(mgWebComponents_path);
  https.get(mgWebComponents_url, function(response) {
    response.pipe(file1);
    console.log('mg-webComponents installed');
  });
}

if (!fs.existsSync(qewd_client_path)) {
  let file2 = fs.createWriteStream(qewd_client_path);
  https.get(qewd_client_url, function(response) {
    response.pipe(file2);
    console.log('qewd-client installed');
  });
}

if (!fs.existsSync(components_path)) {
  fs.mkdirSync(components_path);
}

let installed = true;
let maxToFetch = 0;
let count = 0;
let halt;

let patha = components_path + '/adminui';
if (!fs.existsSync(patha)) {
  installed = false;
  maxToFetch++;
  git_clone(wc_adminui_url, patha, function() {
    count++;
    if (count === maxToFetch) {
      exit_process();
      /*
      if (process.argv[2] && process.argv[2] !== '') {
        return run_qewd(null, process.argv[2], true);
      }
      run_qewd();
      */
    }
  });
}

let pathb = components_path + '/leaflet';
if (!fs.existsSync(pathb)) {
  installed = false;
  maxToFetch++;
  git_clone(wc_leaflet_url, pathb, function() {
    count++;
    if (count === maxToFetch) {
      exit_process();
      /*
      if (process.argv[2] && process.argv[2] !== '') {
        return run_qewd(null, process.argv[2], true);
      }
      run_qewd();
      */
    }
  });
}

let pathc = components_path + '/d3';
if (!fs.existsSync(pathc)) {
  installed = false;
  maxToFetch++;
  git_clone(wc_d3_url, pathc, function() {
    count++;
    if (count === maxToFetch) {
      exit_process();
      /*
      if (process.argv[2] && process.argv[2] !== '') {
        return run_qewd(null, process.argv[2], true);
      }
      run_qewd();
      */
    }
  });
}

if (!fs.existsSync(qm_adminui_path)) {
  installed = false;
  maxToFetch++;
  git_clone(qm_adminui_url, qm_adminui_path, function() {
    fs.moveSync(qm_adminui_path + '/qewd-apps', qm_adminui_qewd_apps_path);
    count++;
    if (count === maxToFetch) {
      exit_process();
      /*
      if (process.argv[2] && process.argv[2] !== '') {
        return run_qewd(null, process.argv[2], true);
      }
      run_qewd();
      */
    }
  });
}


if (process.platform === 'win32' && !fs.existsSync(dbx_node_file)) {
  installed = false;
  maxToFetch++;
  console.log('Installing mg-dbx interface module for Windows');
  let version = process.version.split('.')[0];
  url = dbx_github_url[version];
  if (url) {
    file = fs.createWriteStream(dbx_node_file);
    request = https.get(url, function(response) {
      let st = response.pipe(file);

      st.on('finish', function() {
        console.log('mg-dbx installed');

        let install_sql = require('./install_sql');
        // need to allow a bit of time for mg-dbx module to be ready for use
        setTimeout(function() {
          install_sql(function() {
            count++;
            if (count === maxToFetch) {
              exit_process();
            }
          });
        }, 2000);
      });
    });
  }
  else {
    console.log('Node.js version ' + version + 'is not supported by QEWD');
  }

}

if (installed) {
  if (process.argv[2] && process.argv[2] !== '') {
    return run_qewd(null, process.argv[2], true);
  }
  run_qewd();
}
