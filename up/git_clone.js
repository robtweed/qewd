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

 14 May 2020

  Emulation of Git Clone without any dependency on Git itself

  eg: 

     let target = process.cwd() + '/adminui';
     git_clone('https://github.com/robtweed/qewd-monitor-adminui', target, function() {
       console.log('done!');
     });

*/

let request = require('request');
let fs = require('fs-extra');
let unzip = require('extract-zip');
let uuid = require('uuid/v4');

function git_clone(url, targetDir, callback) {

  let zipFile = 'temp-' + uuid() + '.zip';
  let file = fs.createWriteStream(zipFile);
  url = url + '/zipball/master/';

  let st = request(url).pipe(file);
  let tempDir = process.cwd() + '/temp-' + uuid();

  st.on('finish', async function() {
    await unzip(zipFile, { dir: tempDir });
    let dir = fs.readdirSync(tempDir)[0];
    let src = tempDir + '/' + dir;
    let dirs = fs.readdirSync(src);
    if (fs.existsSync(targetDir)) {
      fs.removeSync(targetDir);
    }  
    fs.mkdir(targetDir);
    dirs.forEach(function(dir) {
      fs.moveSync(src + '/' + dir, targetDir + '/' + dir);
    });
    fs.removeSync(tempDir);
    fs.removeSync(zipFile);
    if (callback) callback();
  });
}

module.exports = git_clone;
