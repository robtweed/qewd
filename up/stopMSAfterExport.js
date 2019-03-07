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

  7 March 2019

*/

var child_process = require('child_process');

module.exports = function(message, jwt, forward, sendBack) {

  // will be moved during startup to /apis/importRoutes/onMSResponse.js
  // if config.json shows imported to be false
  //  and if running in import mode
 
  console.log('*** MicroService import completed - shutting down ***');

  // delete the importRoutes API

  var cmd = 'rm -r /opt/qewd/mapped/apis/importRoutes';
  child_process.execSync(cmd, {stdio:[0,1,2]});

  var _this = this;
  setTimeout(function() {
    _this.stop();
  }, 1000);

  return false;

};