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

  4 July 2019

*/

console.log('running up/qewdAppHandler.js in process ' + process.pid);

var createDocStoreEvents = require('./createDocStoreEvents');
var handleDocStoreEvents = require('./handleDocStoreEvents');

var fs = require('fs');

function getDirectories(path) {
  return fs.readdirSync(path).filter(function(file) {
    return fs.statSync(path + '/' + file).isDirectory();
  });
}

function use_microservice(message, send) {
  //console.log('&& use_microservice handler: message = ' + JSON.stringify(message, null, 2));
  if (!message.request.headers) {
    message.request.headers = {
      authorization: 'Bearer ' + message.token
    };
  }
  var original_app = message.ewd_application;
  var _this = this;

  this.microServiceRouter.call(this, message.request, function(responseObj) {
    //console.log('*** response from microservice: ' + JSON.stringify(responseObj, null, 2));
    responseObj.type = message.original_type;

    console.log('type switched to ' + responseObj.type);

    // change JWT application back to original

    var msg = {
     type: 'ewd-jwt-updateExpiry',
      params: {
        jwt: responseObj.message.token,
        application: original_app
      }
    };

    _this.handleMessage(msg, function(newJWTObj) {
      responseObj.message.token = newJWTObj.message.jwt;
      send (responseObj);
    });
  });
  return true; // response to client will be handled by callback above
}

module.exports = function(appPath) {
  var handlers = {};
  var workerResponseHandlers = {
    use_microservice: use_microservice
  };

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

  var docStoreEvents;
  var rootPath = '/opt/qewd/mapped/';
  if (process.env.qewd_service_name) {
    rootPath = process.cwd() + '/' + process.env.qewd_service_name + '/';
  }
  if (process.env.mode && process.env.microservice) {
    rootPath = process.cwd() + '/' + process.env.microservice + '/';
  }
  var docStoreEventsPath = rootPath + 'docStoreEvents/events.json';
  if (fs.existsSync(docStoreEventsPath)) {
    docStoreEvents = createDocStoreEvents(docStoreEventsPath, rootPath);
    //console.log('** docStoreEvents: ' + JSON.stringify(docStoreEvents, null, 2));
  }

  var handlerModule = {
    handlers: handlers,
    workerResponseHandlers: workerResponseHandlers
  };

  var onLoadPath = appPath + '/onLoad.js';
  console.log('onLoadPath = ' + onLoadPath);

  var docStoreEventsFn = function() {};
  if (docStoreEvents) {
    docStoreEventsFn = function() {
      handleDocStoreEvents.call(this, docStoreEvents);
    };
  }

  var onLoadFn = function() {};
  if (fs.existsSync(onLoadPath)) {
    onLoadFn = require(onLoadPath);
  }

  handlerModule.init = function() {
    docStoreEventsFn.call(this);
    onLoadFn.call(this);
  };

  var beforeHandlerPath = appPath + '/beforeHandler.js';
  console.log('beforeHandlerPath = ' + beforeHandlerPath);
  if (fs.existsSync(beforeHandlerPath)) {
    handlerModule.beforeHandler = require(beforeHandlerPath);
  }

  var servicesAllowedPath = appPath + '/servicesAllowed.json';
  console.log('servicesAllowedPath = ' + servicesAllowedPath);
  if (fs.existsSync(servicesAllowedPath)) {
    try {
      handlerModule.servicesAllowed = require(servicesAllowedPath);
      console.log('servicesAllowed loaded: ' + JSON.stringify(handlerModule.servicesAllowed, null, 2));
    }
    catch(err) {
      console.log('Unable to load ' + servicesAllowedPath);
    }
  }

  return handlerModule;
};

