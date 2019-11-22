/*

 ----------------------------------------------------------------------------
 | qewd-up: Rapid QEWD API Development                                      |
 |                                                                          |
 | Copyright (c) 2018-19 M/Gateway Developments Ltd,                        |
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

  22 November 2019

*/

const dbx_github_url = "https://raw.githubusercontent.com/chrisemunt/mg-dbx/master/bin/winx64/node12/mg-dbx.node"
const dbx_node_file = 'node_modules/mg-dbx.node';

var fs = require('fs-extra');
var run_qewd = require('./run');

if (process.platform === 'win32' && !fs.existsSync(dbx_node_file)) {
  console.log('Installing mg-dbx interface module for Windows');
  var https = require('https');
  var file = fs.createWriteStream(dbx_node_file);
  var request = https.get(dbx_github_url, function(response) {
    response.pipe(file);
    console.log('mg-dbx installed.  QEWD can now start');
    run_qewd();
  });
}
else {
  run_qewd();
}
