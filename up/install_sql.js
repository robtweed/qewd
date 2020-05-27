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

  26 May 2020

  Windows / IRIS/Cache: Installs the mg-dbx SQL interface

*/

module.exports = function() {
  let https = require('https');
  let fs = require('fs-extra');
  let qewd_mg_dbx = require('qewd-mg-dbx');

  let config_all = require('../../../configuration/config.json');

  // dirname = C:\testing\node_modules\qewd\up

  let params = config_all.qewd.database.params;
  params.type = params.database;
  let platform = params.type.toLowerCase();
  delete params.database;
  let db = new qewd_mg_dbx({database: params});
  db.open();

  let filename;
  let url = 'https://raw.githubusercontent.com/chrisemunt/mg-dbx/master/m/zmgsi';
  if (platform === 'iris') {
    url = url + '_iris.xml';
    filename = 'temp.xml';
  }
  else {
    url = url + '_isc.ro';
    filename = 'temp.ro';
  }

  filename = __dirname + '\\' + filename;

  let file = fs.createWriteStream(filename);

  console.log('fetching SQL Interface from ' + url);
  let request = https.get(url, function(response) {
    let st = response.pipe(file);
  
    st.on('finish', function() {
      try {
        let result = db.dbx.classmethod('%SYSTEM.OBJ', 'Load', filename, 'ck');
        console.log('mg-dbx SQL interface installed: ' + result);
      }
      catch(err) {
        console.log('Error trying to install the mg-dbx SQL Interface:');
        console.log(err);
      }
      fs.removeSync(filename);
      db.close();
    });
  });
};
