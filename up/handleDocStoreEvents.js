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

  28 February 2019

*/

const ESC = '~~';

function pathFromSubs(subsArr) {
  var path = '';
  var delim = '';
  subsArr.forEach(function(subscript) {
    path = path + delim + subscript;
    delim = '/';
  });
  return path;
}

function toSubs(path) {
  var subs = path.split('/');
  subs.forEach(function(subscript, index) {
    subs[index] = subscript.toString().split(ESC).join('/');
  });
  return subs;
}

function deleteIndex(docNode, docStoreEvents) {

  var indexObj;
  var indexDoc;
  var indexPath;
  var matchObj;
  var before;
  var routeToIndex;
  var path;

  var beforeDeletePath = pathFromSubs(docNode.path);
  var documentName = docNode.documentName;

  for (path in docStoreEvents[documentName].indices) {
    //console.log(documentName + ': ' + docNode.path + ': trying path ' + path);
    indexObj = docStoreEvents[documentName].indices[path];
    routeToIndex = indexObj.targetRoute;
    matchObj = routeToIndex.match(beforeDeletePath);
    //console.log('matchObj = ' + JSON.stringify(matchObj, null, 2));
    if (matchObj) {
      // exact path match, so delete specific index
      matchObj.value = docNode.value.toString().split('/').join(ESC);
      indexPath = indexObj.indexRoute.reverse(matchObj);
      //console.log('deleting index: ' + toSubs(indexPath));
      indexDoc = this.db.use(indexObj.documentName);
      indexDoc.$(toSubs(indexPath)).delete(); 
    }
  }
}

module.exports = function(docStoreEvents) {

  var _this = this;

  this.documentStore.on('afterSet', function(docNode) {
    //console.log('&&&& afterSet triggered for ' + JSON.stringify(docNode, null, 2));
    if (docStoreEvents[docNode.documentName]) {
      if (docStoreEvents[docNode.documentName].indices) {

        var afterSetPath = pathFromSubs(docNode.path);
        var indexObj;
        var indexDoc;
        var indexPath;
        var matchObj;
        var before;
        var routeToIndex;

        for (var path in docStoreEvents[docNode.documentName].indices) {
          //console.log('trying path ' + path);
          indexObj = docStoreEvents[docNode.documentName].indices[path];
          routeToIndex = indexObj.targetRoute;
          matchObj = routeToIndex.match(afterSetPath);
          //console.log('matchObj = ' + JSON.stringify(matchObj, null, 2));
          if (matchObj) {
            if (indexObj.handler) {
              indexObj.handler.afterSet.call(_this, docNode);
            }
            else if (indexObj.indexRoute && docNode.value !== '') {
              indexDoc = _this.db.use(indexObj.documentName);
              //console.log('index document name: ' + indexObj.documentName);
              before = docNode.before;
              if (before.exists && before.value !== '' && docNode.value !== before.value) {
                matchObj.value = before.value.toString().split('/').join(ESC);
                indexPath = indexObj.indexRoute.reverse(matchObj);
                //console.log('*** deleting old index: ' + indexPath);
                indexDoc.$(toSubs(indexPath)).delete();
              }
              matchObj.value = docNode.value.toString().split('/').join(ESC);
              indexPath = indexObj.indexRoute.reverse(matchObj);
              //console.log('creating index: ' + toSubs(indexPath));
              indexDoc.$(toSubs(indexPath)).value = ''; 
            }
          }
        }
      }
    }
  });

  this.documentStore.on('beforeDelete', function(docNode) {
    //console.log('&&&& beforeDelete triggered for ' + JSON.stringify(docNode, null, 2));
    if (docStoreEvents[docNode.documentName]) {
      if (docStoreEvents[docNode.documentName].indices) {
        var rootDoc = new _this.documentStore.DocumentNode(docNode.documentName, docNode.path); 

        if (rootDoc.hasValue) {
          // deleting a leaf node so find exact index match(es) and delete them
          deleteIndex.call(_this, docNode, docStoreEvents)
        }
        else {
          // deleting at a higher level in node tree
          //  so spin through the leaf nodes at this level and see if any 
          //  are indexed - if so, delete them

          //console.log('deleting at higher level of document');

          rootDoc.forEachLeafNode(function(value, leafNode) {
            deleteIndex.call(_this, leafNode, docStoreEvents)
          });
        }
      }
    }
    else {
      //console.log('beforeDelete ignored for ' + docNode.documentName);
    } 
  });

};
