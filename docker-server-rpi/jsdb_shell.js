/*

 ----------------------------------------------------------------------------
 | qewd-jsdb-shell: For use in Node REPL                                    |
 |                                                                          |
 | Copyright (c) 2019 M/Gateway Developments Ltd,                        |
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

const ydb_release = 'r1.30';


function jsdb() {
  var qewd_mg_dbx = require('qewd-mg-dbx');
  var DocumentStore = require('ewd-document-store');
  var os = require('os');
  var arch = os.arch();
  if (arch === 'x64') arch = 'x86';

  var params = {
    database: {
      type: 'YottaDB',
      release: ydb_release,
      architecture: arch
    }
  };

  var db = new qewd_mg_dbx(params);
  var status = db.open();
  if (status.error) return status;
  var documentStore = new DocumentStore(db);
  documentStore.close = db.close.bind(db);
  return documentStore;

};

module.exports = jsdb();

