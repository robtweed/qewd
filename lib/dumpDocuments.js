/*!

 ----------------------------------------------------------------------------
 | qewd: Quick and Easy Web Development                                     |
 |                                                                          |
 | Copyright (c) 2023 MGateway Ltd,                                         |
 | Banstead, Surrey UK.                                                     |
 | All rights reserved.                                                     |
 |                                                                          |
 | https://www.mgateway.com                                                 |
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

  9 May 2018 

*/

var fs = require('fs-extra');
var path = require('path');

function createJSONFile(contentsObj, rootPath, fileName) {
  var packageJsonFile = path.join(rootPath, fileName);
  fs.outputJsonSync(packageJsonFile, contentsObj, {spaces: 2});
  fs.chmodSync(packageJsonFile, '0664');
};

module.exports = function(messageObj) {
  var docArray = this.db.global_directory();
  var self = this;

  var documentContent = {};
  var rootPath = __dirname;
  var fileName = 'documents.json';
  if (messageObj.params) {
    if (messageObj.params.rootPath) rootPath = messageObj.params.rootPath;
    if (messageObj.params.fileName) fileName = messageObj.params.fileName;
  }

  docArray.forEach(function(docName) {
    if (docName !== self.userDefined.config.sessionDocumentName) {
      var doc = self.db.use(docName);
      documentContent[docName] = doc.getDocument(true);
    }
  });

  createJSONFile(documentContent, rootPath, fileName);

};
