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


module.exports = function(documentName, docSubName, query, showDetail) {
  if (typeof docSubName === 'undefined' || docSubName === '') {
    return {error: 'Document name not defined or empty'};
  }
  var docIndex = this.db.use(documentName + 'Index', docSubName);
  if (!docIndex.exists) {
    return {error: 'No ' + docSubName + ' Documents exist in ' + documentName};
  }
  var id;
  var matches;
  var children;
  var passNo = 0;
  var path;
  var value;
  var pieces;
  var prefix;
  for (var name in query) {
    passNo++;
    children = {};
    path = name.split('.');
    value = query[name];
    if (value !== '') {
      if (value.indexOf('*') === -1) {
        path.push(value);
        docIndex.$(path).forEachChild(function(id) {
          children[id] = true;
        });
      }
      else if (value[value.length -1] === '*') {
        prefix = value.slice(0, -1); // remove * from end
        docIndex.$(path).forEachChild({prefix: prefix}, function(subs, node) {
          node.forEachChild(function(id) {
            children[id] = true;
          });
        });
      }
    }
    if (passNo === 1) {
      matches = children;
    }
    else {
      for (id in matches) {
        if (!children[id]) delete matches[id];
      }
    }
  }
  var results = [];
  var doc;
  if (showDetail === 'true') showDetail = true;
  if (showDetail) {
    results = {};
    doc = this.db.use(documentName, docSubName);
  }
  for (id in matches) {
    if (showDetail) {
      results[id] = doc.$(id).getDocument(true);
    }
    else {
      results.push(id);
    }
  }
  return results;
};
