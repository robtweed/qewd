/*

 ----------------------------------------------------------------------------
 | qewd-up: Rapid QEWD API Development                                      |
 |                                                                          |
 | Copyright (c) 2023 MGateway Ltd,                                         |
 | Banstead, Surrey UK.                                                     |
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

  14 March 2019

*/

var Route = require('route-parser');

module.exports = function(docStoreEventsPath, rootPath) {

  var docStoreEvents;

  try {
    docStoreEvents = require(docStoreEventsPath).documents;
    console.log('** Loaded docStoreEvents definitions from ' + docStoreEventsPath);
    //console.log('docStoreEvents: ' + JSON.stringify(docStoreEvents, null, 2));
  }
  catch(err) {
    console.log('** Warning - unable to load docStoreEvents definitions from ' + docStoreEventsPath);
    console.log(err);
    return;
  }

  //var docStoreEvents = {};

  var path;
  var documentName;
  var indexObj;
  var handlerPath;
  var handler;
  var indexRoute;
  var obj;

  for (documentName in docStoreEvents) {
    docStoreEvents[documentName].indices = {};
    for (path in docStoreEvents[documentName].pathsToIndex) {
      indexObj = docStoreEvents[documentName].pathsToIndex[path];
      handler = undefined;
      if (indexObj.handler) {
        handlerPath = rootPath + 'docStoreEvents/' + indexObj.handler;
        try {
          handler = require(handlerPath);
          console.log('** Event handler successfully loaded from ' + handlerPath);
        }
        catch(err) {
          console.log('** Warning - unable to load ' + handlerPath);
        }
      }
      if (indexObj.path) {
        indexRoute = new Route(indexObj.path);
      }
      else {
        indexRoute = undefined;
      }
      obj = {
        documentName: indexObj.documentName || documentName,
        targetRoute: new Route(path),
        handler: handler,
        indexRoute: indexRoute,
        apply: indexObj.apply,
        value: indexObj.value
      };
      docStoreEvents[documentName].indices[path] = obj;
    }
  }

  return docStoreEvents;
};



