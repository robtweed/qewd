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

function isInt(value) {
  return !isNaN(value) && parseInt(Number(value)) == value && !isNaN(parseInt(value, 10));
}

module.exports = function(documentName, docSubName, id) {
  if (typeof docSubName === 'undefined' || docSubName === '') {
    return {error: 'Document name not defined or empty'};
  }
  if (typeof id === 'undefined' || id === '') {
    return {error: 'Id not defined or empty'};
  }
  var doc = this.db.use(documentName, docSubName, id);
  if (!doc.exists) {
    return {error: 'No Document exists for that Id (' + id + ')'};
  }

  var docIndex = this.db.use(documentName + 'Index', docSubName);
  doc.forEachLeafNode(function(data, leafNode) {
    if (data !== '') {
      var subscripts = leafNode._node.subscripts;
      subscripts.splice(0, 2);  // remove 1st 2 subscripts
      var subs = [];
      subscripts.forEach(function(sub) {
        if (!isInt(sub)) subs.push(sub);
      });
      subs.push(data);
      subs.push(id);
      docIndex.$(subs).delete();
    }
  });

  doc.delete();
  return {ok: true};
};