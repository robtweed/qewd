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

  15 January 2019

*/

console.log('running up/qewdAppHandler.js in process ' + process.pid);

var fs = require('fs');

function getDirectories(path) {
  return fs.readdirSync(path).filter(function(file) {
    return fs.statSync(path + '/' + file).isDirectory();
  });
}

module.exports = function(appPath) {
  var handlers = {};
  var workerResponseHandlers = {};

  var handlerList = getDirectories(appPath);
  handlerList.forEach(function(name) {
    var handlerPath = appPath + '/' + name;
    handlers[name] = require(handlerPath);
    var onResponsePath = handlerPath + '/onResponse.js';
    console.log('onResponsePath = ' + onResponsePath);
    if (fs.existsSync(onResponsePath)) {
      console.log('workerResponseHandler loaded');
      workerResponseHandlers[name] = require(onResponsePath);
    }
  });

  /*
  var handlerModule = {
    init: function(application) {
    },
    beforeHandler: function(messageObj, session, send, finished) {
    },
    handlers: handlers,
    workerResponseHandlers: workerResponseHandlers
  };
  */

  var handlerModule = {
    handlers: handlers,
    workerResponseHandlers: workerResponseHandlers
  };

  var onLoadPath = appPath + '/onLoad.js';
  console.log('onLoadPath = ' + onLoadPath);
  if (fs.existsSync(onLoadPath)) {
    handlerModule.init = require(onLoadPath);
  }

  var beforeHandlerPath = appPath + '/beforeHandler.js';
  console.log('beforeHandlerPath = ' + beforeHandlerPath);
  if (fs.existsSync(beforeHandlerPath)) {
    handlerModule.beforeHandler = require(beforeHandlerPath);
  }

  return handlerModule;
};

