/*!

 ----------------------------------------------------------------------------
 | qewd: Quick and Easy Web Development                                     |
 |                                                                          |
 | Copyright (c) 2017-19 M/Gateway Developments Ltd,                        |
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

  21 January 2019

*/

var ewdQueueDocument = 'ewdQueue';
var resilientMode = require('./resilientMode');
var handleJWT = require('./jwtHandler');

var customSocketConnections = {};

function clearSocketData() {
  var self = this;
  this.io.clients(function(error, clients) {
    var clientHash = {};
    clients.forEach(function(socketId) {
      clientHash[socketId] = true;
    });
    for (var socketId in q.sockets) {
      if (!clientHash[socketId]) {
        delete self.sockets[socketId];
        console.log('application mapping for defunct socket ' + socketId + ' deleted');
      }
    }
  });
}

function isEmpty(obj) {
  if (Array.isArray(obj)) return false;
  for (var name in obj) {
    return false;
  }
  return true;
}

module.exports = function(q, io, customModule) {

  var customSockets;
  if (customModule) customSockets = require(customModule);

  io.on('connection', function (socket) {
    if (!q.workerResponseHandlers) q.workerResponseHandlers = {};
  
    /*
    function sendMessageToClient(messageObj) {
      //console.log('sending to socket ' + socket.id);
      socket.emit('ewdjs', messageObj);
    };
    */

    var handleMessage = function(data) {
      var startTime = new Date();
      var expectJWT = false;

      if (typeof data !== 'object') {
        console.log('Received message is not an object: ' + data);
        return;
      }
      var type = data.type;
      if (!type) {
        console.log('No type defined for message: ' + JSON.stringify(data));
        return;
      }

      // valid websocket message received from browser
 
      var responseObj;
      if (type === 'ewd-register' || type === 'ewd-reregister') {
        data.socketId = socket.id;
        data.ipAddress = socket.request.connection.remoteAddress;
        if (data.jwt && type === 'ewd-register') {
          // record application used by this new socket
          if (!q.sockets) q.sockets = {};
          q.sockets[socket.id] = {
            application: data.application,
            jwt: true
          };
          // clear down records for any disconnected clients
          //clearSocketData.call(q);
        }
      }

      //console.log('** sockets: incoming message received: ' + JSON.stringify(data));
      // for browser-based applications that use JWTs
      //  but NOT for MicroService server connections over web sockets

      //if (socket && socket.id) console.log('socket.id = ' + socket.id);
      //if (q.sockets && q.sockets[socket.id]) console.log('q.sockets[socket.id].jwt = ' + q.sockets[socket.id].jwt);

      if (type !== 'restRequest' && q.sockets && q.sockets[socket.id] && q.sockets[socket.id].jwt) expectJWT = true;
      //console.log('** expectJWT = ' + expectJWT);
      //console.log('** type = ' + type);

      // queue & dispatch message to worker.  Response handled by callback function:
      var thisSocket = socket;
      var ix;
      var count;
      var token = data.token;
		
      if (q.resilientMode && q.db && token) {
        ix = resilientMode.storeIncomingMessage.call(q, data);
        data.dbIndex = ix; // so the worker can record progress to database
        count = 0; 
      }

      var handleResponse = function(resultObj) {
        //console.log('*** handleMessage response ' + JSON.stringify(resultObj));
        // ignore messages directed to specific sockets - these are handled separately - see this.on('response') above
        if (resultObj.socketId) {
          console.log('*** socket-specific message ' + JSON.stringify(resultObj));
          return;
        }

        // intercept response for further processing on master process if required
        var message = resultObj.message;

        var sendMessageToClient = function(responseObj) {
          // make sure original request Id is also added
          if (message && message.ms_requestId) {
            responseObj.ms_requestId = message.ms_requestId;
            if (responseObj.message) responseObj.message.ms_requestId = message.ms_requestId;
          }
          // if worker response handler finished() - ie without a defined response,
          //  don't return any response to browser

          if (!isEmpty(responseObj.message)) {
            //if (responseObj.message) thisSocket.emit('ewdjs', responseObj);
            //console.log('sending ' + JSON.stringify(responseObj));
            responseObj.responseTime = (Date.now() - startTime) + 'ms';
            thisSocket.emit('ewdjs', responseObj);
            if (q.resilientMode && q.db && resultObj.type !== 'ewd-register') {
              count++;
              resilientMode.storeResponse.call(q, resultObj, token, ix, count, handleMessage)
            }
          }
        };

        if (message && message.ewd_application) {
          var application = message.ewd_application;
          if (!message.error) {
            //console.log('****** check for worker response intercept ****');
            // if this application has worker response intercept handlers defined, make sure they are loaded now
            var appPath = application;
            if (!q.workerResponseHandlers[application]) {
              if (q.userDefined.config && q.userDefined.config.moduleMap && q.userDefined.config.moduleMap[application]) {
              appPath = q.userDefined.config.moduleMap[application];
              }
              try {
                q.workerResponseHandlers[application] = require(appPath).workerResponseHandlers || {};
                console.log('**** worker response intercept handler module loaded for ' + application);
              }
              catch(err) {
                error = 'Unable to load worker response intercept handler module for: ' + application;
                q.workerResponseHandlers[application] = {};
              }
            }

            var type = resultObj.type;
            if (application && type && q.workerResponseHandlers && q.workerResponseHandlers[application] && q.workerResponseHandlers[application][type]) {
              var resp = q.workerResponseHandlers[application][type].call(q, message, sendMessageToClient);
              //console.log('workerResponseHandler response: ' + resp);
              if (resp === true) return; // The workerResponseHandler has sent the response to the client itself;
              //if (resp) resultObj.message = resp;
              if (typeof resp === 'undefined') {
                resultObj.message = message;  // WorkerResponseHandler didn't do anything to message
              }
              else {
                resultObj.message = resp;  // workerResponseHandler explicitly returned a message
              }
            }
          }
          if (resultObj.message) delete resultObj.message.ewd_application;
          if (type === 'restRequest') {
            // path was previously added to aid workerResponseHandler filtering
            //  now get rid of it before sending response
            if (resultObj.message) delete resultObj.message.path;
          }
        }

        // send response to browser
        //console.log('sending to socket ' + socket.id);

        sendMessageToClient(resultObj);

        /*
        var responseTime = (Date.now() - startTime) + 'ms';
        console.log('Response time: ' + responseTime);
        resultObj.responseTime = responseTime;
        console.log('main send ' + JSON.stringify(resultObj));
        if (resultObj.message) {
          //console.log('emitting');
          thisSocket.emit('ewdjs', resultObj);
	 }		
        if (q.resilientMode && q.db && resultObj.type !== 'ewd-register') {
          count++;
          resilientMode.storeResponse.call(q, resultObj, token, ix, count, handleMessage)
        }
        */
        
      };

      if (expectJWT && data.token) {
        // browser-based websocket application using JWTs
        console.log('** invoking handleJWT.masterRequest');
        handleJWT.masterRequest.call(q, data, thisSocket, handleResponse);
        return;
      }
      q.handleMessage(data, handleResponse);
    };

    socket.on('ewdjs', handleMessage);  
    socket.on('disconnect', function() {
      delete customSocketConnections[socket.id];
      if (q.sockets) delete q.sockets[socket.id]
      console.log('socket ' + socket.id + ' disconnected');
    });

    if (customSockets && !customSocketConnections[socket.id]) {
      // load the custom handlers for this socket - unless already loaded
      console.log('** Loading custom socket module handlers for socket ' + socket.id);
      customSockets(io, socket, q);
      customSocketConnections[socket.id] = 'connected';
    }

  });
  if (q.jwt) q.jwt.handlers = handleJWT;
  q.io = io;
  q.io.toAll = function(message) {
    io.emit('ewdjs', message);
  };
  q.io.toApplication = function(message, application) {
    for (var id in q.sockets) {
      if (q.sockets[id].application === application) {
        q.io.to(id).emit('ewdjs', message);
      }
    }
  };
};
