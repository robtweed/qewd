/*

 ----------------------------------------------------------------------------
 | qewd: Quick and Easy Web Development                                     |
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

  10 October 2017

*/

var fs = require('fs-extra');
var os = require('os');
var https = require('https');
var readline = require('readline');
var child_process = require('child_process');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function download(url, dest, cb) {
  var file = fs.createWriteStream(dest);
  var request = https.get(url, function(response) {
    response.pipe(file);
    file.on('finish', function() {
      file.close(cb);  // close() is async, call cb after close completes.
    });
  }).on('error', function(err) { // Handle errors
    fs.unlink(dest); // Delete the file async. (But we don't check the result)
    if (cb) cb(err.message);
  });
};

function npmInstall(moduleName) {
  child_process.execSync('npm install ' + moduleName, {stdio: 'inherit'});
}

function runBash(scriptName) {
  child_process.execSync('sh ' + scriptName, {stdio: 'inherit'});
}

function ok() {
  console.log('QEWD.js is ready to run');
  console.log('You should now be able to start QEWD by typing: node qewd');
}

function startupFile(dir) {
  rl.question('Which database/server setup are you using (cache | gtm | yottadb | redis | rpi): ', (db) => {
    if (!db || db === '') {
      console.log('You must specify a database!');
      return startupFile(dir);
    }

    var fromPath;
    var toPath = dir + '/qewd.js';

    if (db === 'cache') {

      var oPath = {
        Linux: 'linux',
        Windows_NT: 'win64',
        Darwin: 'osx'
      };
      var fileNames = {
        '4': '421',
        '6': '610',
        '7': '700',
        '8': '800'
      };
      var nodeVer = process.version;
      nodeVer = nodeVer.split('v')[1];
      nodeVer = nodeVer.split('.')[0];
      var platform = os.type();
      
      var url = 'https://s3-eu-west-1.amazonaws.com/cache.node/build-140/' + oPath[platform] + '/cache' + fileNames[nodeVer] + '.node';

      var dest = dir + '/node_modules/cache.node';

      console.log('cache.node url: ' + url);
      console.log('to be saved as ' + dest);

      download(url, dest, function(err) {
        if (!err) {
          fromPath = dir + '/node_modules/qewd/example/qewd.js';
          fs.copySync(fromPath, toPath);
          console.log('Check the Cache configuration parameters in your startup file: ' + dir + '/qewd.js');
          console.log('Then you can start up QEWD by typing: node qewd');
        }
        rl.close();
      });
      return;
    }

    if (db === 'redis') {
      var platform = os.type();
      if (platform === 'Linux') {
        var prepareScript = dir + '/node_modules/qewd/installers/prepare.sh';
        runBash(prepareScript);
      }

      npmInstall('tcp-netx');
      npmInstall('ewd-redis-globals');
      fromPath = dir + '/node_modules/qewd/example/qewd-redis.js';
      fs.copySync(fromPath, toPath);
      ok();
      rl.close();
      return;
    }

    if (db === 'rpi') {
      npmInstall('tcp-netx');
      npmInstall('ewd-redis-globals');
      fromPath = dir + '/node_modules/qewd/example/qewd-rpi.js';
      fs.copySync(fromPath, toPath);
      ok();
      rl.close();
      return;
    }

    if (db === 'gtm' || db === 'yottadb') {

      if (!fs.existsSync(dir + '/node_modules/nodem') && typeof process.env['gtm_dist'] !== 'undefined') {
        // safe and appropriate to install NodeM
        runBash(dir + '/node_modules/qewd/installers/install_nodem.sh ' + dir);
      }

      fromPath = dir + '/node_modules/qewd/example/qewd-gtm.js';
      fs.copySync(fromPath, toPath);
      ok();
      rl.close();
      return;
    }

    console.log('Invalid database! Try again');
    startupFile(dir);
  });
}

function run() {

  var cwd = process.cwd();
  if (cwd.indexOf('node_modules/') !== -1) process.chdir('../..');
  cwd = process.cwd();

  rl.question('QEWD Installation Directory: (' + process.cwd() + '): ', (dir) => {
    if (!dir || dir === '') dir = process.cwd();

    console.log('Setting up QEWD in directory ' + dir);

    var wwwPath = dir + '/www';
    var www_exists = fs.existsSync(wwwPath);
    console.log('www exists: ' + www_exists);

    if (!www_exists) {
      fs.mkdirSync(wwwPath);
      console.log('www directory created');
    }

    var monitorPath = wwwPath + '/qewd-monitor';
    var path_exists = fs.existsSync(monitorPath);
    console.log('www/qewd-monitor exists: ' + path_exists);

    if (!path_exists) {
      fs.mkdirSync(monitorPath);
      console.log('www/qewd-monitor directory created');
    }

    var fromPath = dir + '/node_modules/qewd-monitor/www';

    fs.copySync(fromPath, monitorPath);

    startupFile(dir);
  });
}

run();

