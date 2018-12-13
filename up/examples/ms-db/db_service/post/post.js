/*

 ----------------------------------------------------------------------------
 | QEWD-Up Demonstration of Document Database Functionality                 |
 |                                                                          |
 | Copyright (c) 2018 M/Gateway Developments Ltd,                           |
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

  13 December 2018

*/


var traverse = require('traverse');

function isEmptyObject(obj) {
  for (var prop in obj) {
    return false;
  }
  return true;
}

function isInt(value) {
  return !isNaN(value) && parseInt(Number(value)) == value && !isNaN(parseInt(value, 10));
}

module.exports = function(documentName, docSubName, body) {

  if (typeof docSubName === 'undefined' || docSubName === '') {
    return {error: 'Document name not defined or empty'};
  }
  if (typeof body === 'undefined' || body === '' || isEmptyObject(body)) {
    return {error: 'Document Content (body) not defined or empty'};
  }
  var doc = this.db.use(documentName, docSubName);
  var id = doc.increment();
  doc.$(id).setDocument(body);
  // create indices
  var docIndex = this.db.use(documentName + 'Index', docSubName);
  traverse(body).map(function(node) {
    if (typeof node !== 'object' && node !== '') {
      var subscripts = [];
      this.path.forEach(function(sub) {
        if (!isInt(sub)) subscripts.push(sub);
      });
      subscripts.push(node);
      subscripts.push(id);
      docIndex.$(subscripts).value = id;
    }
  });
  return {
    ok: true,
    id: id
  };
};