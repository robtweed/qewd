/*

 ----------------------------------------------------------------------------
 | qewd: Quick and Easy Web Development                                     |
 |                                                                          |
 | Copyright (c) 2017 M/Gateway Developments Ltd,                           |
 | Reigate, Surrey UK.                                                      |
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

  3 January 2017

*/

var gtm = require('nodem');
var db = new gtm.Gtm();
var ok = db.open();

var DocumentStore = require('ewd-qoper8-gtm/node_modules/ewd-document-store');
var documentStore = new DocumentStore(db);

var queue = new documentStore.DocumentNode('ewdQueue');
var messages = queue.$('message');
var pending = queue.$('pending');

var now = new Date().getTime();
var diff = process.argv[2];
if (!diff) diff = 3600; // default leave 1 hour's worth of records

diff = diff * 1000;
var cutOff = now - diff;

messages.forEachChild(function(dbIndex, messageObj) {
  var timestamp = parseInt(dbIndex.split('-')[0]);
  if (timestamp < cutOff) {
    var token = messageObj.$('token').value;
    if (!pending.$(token).exists) {
      messageObj.delete();
      console.log(dbIndex + ' deleted');
    }
  }

});

db.close();
