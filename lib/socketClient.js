/*

 ----------------------------------------------------------------------------
 | qewd: Quick and Easy Web Development                                     |
 |                                                                          |
 | Copyright (c) 2017-18 M/Gateway Developments Ltd,                        |
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

  09 October 2018

*/

var events = require('events');
var io = require('socket.io-client');
var jwtHandler = require('./jwtHandler');

var ms_response_handlers = {};

function start(params) {

  var self = this;

  this.application = params.application || 'undefined';
  this.url = params.url || false;
  this.log = params.log || false;
  this.jwt = params.jwt || false;
  this.connected = false;
  if (!this.url) return;
  this.hasEventHandler = {};

  var socket = io(this.url, {transports: ['websocket']});

  this.on('error', function(message) {
  });

  function handleResponse(messageObj) {
    // messages received back from socket server

    /*

    don't disconnect a QEWD socket connection!

    if (messageObj.message && messageObj.message.error && messageObj.message.disconnect) {
      if (typeof socket !== 'undefined') {
        socket.disconnect();
        console.log('Socket disconnected');
      }
      return;
    }
    */

    if (messageObj.type === 'ewd-register') {
      self.token = messageObj.message.token;
      console.log(self.application + ' registered');
      self.emit('ewd-registered');
      return;
    }

    if (messageObj.type === 'ewd-reregister') {
      console.log('Re-registered');
      self.emit('ewd-reregistered');
      return;
    }

    if (self.log) console.log('received: ' + JSON.stringify(messageObj));

    if (messageObj.type === 'error' && typeof messageObj.message === 'string') {

      // This will be a response from a MicroService that has had an unexpected exception
      //  As such, it won't have been able to return the MicroService request Id
      //  so the master process won't be able to link it to the Express / Koa response object
      //  The error response therefore can't be returned to the client that made the request

      messageObj = {
        message: {
          error: messageObj.message
        }
      };
    }

    if (messageObj.message && messageObj.message.error) {

      var id;

      // for MicroService responses, get response handler from the hash and execute it
      if (messageObj.message.ms_requestId && ms_response_handlers[messageObj.message.ms_requestId]) {
        id = +messageObj.message.ms_requestId;
        delete messageObj.message.ms_requestId;
        ms_response_handlers[id](messageObj);
        delete ms_response_handlers[id];
      }
      else {
        console.log('Emitting error as restRequest: ' + JSON.stringify(messageObj));
        self.emit("restRequest", messageObj);
      }
      return;
    }

    // for MicroService responses, get response handler from the hash and execute it
    if (messageObj.message && messageObj.message.ms_requestId && ms_response_handlers[messageObj.message.ms_requestId]) {
      id = +messageObj.message.ms_requestId;
      delete messageObj.message.ms_requestId;
      ms_response_handlers[id](messageObj);
      delete ms_response_handlers[id];
    }
    else if (!messageObj.message && messageObj.type === 'restRequest') {
      // Looks like the MicroService's WorkerResponseHandler didn't return a valid message
      messageObj.message = {
        error: 'Bad response from a MicroService Worker Response Handler - no message property found'
      };
      self.emit('restRequest', messageObj);
    }
    else {
      var eventName = messageObj.type;
      console.log('Emitting event ' + eventName);
      self.emit(eventName, messageObj);
    }
  }

  socket.on('connect', function() {

    self.disconnectSocket = function() {
      socket.disconnect();
      console.log('qewd-socketClient disconnected socket');
    };
    var message;
    if (self.token) {
      // re-connection occured - re-register to attach to original Session
      // need to update JWT expiry to ensure it re-connects OK

     console.log('*** socketClient re-register - secret = ' + self.jwt.secret);

      self.token = jwtHandler.updateJWTExpiry.call(self, self.token)

      message = {
        type: 'ewd-reregister',
        token: self.token
      };
      if (self.jwt) message.jwt = true;
    }
    else {
      message = {
        type: 'ewd-register',
        application: self.application
      };
      if (self.jwt) message.jwt = true;
    }
    self.connected = true;
    socket.emit('ewdjs', message);
  }); 

  socket.on('ewdjs', handleResponse);

  this.addHandler = function(type, callback) {
    self.on(type, callback);
    self.hasEventHandler[type] = callback;
  };

  this.sub = this.addHandler;

  this.removeHandler = function(type) {
    var callback = self.hasEventHandler[type];
    self.removeListener(type, callback);
    self.hasEventHandler[type] = false;
  };

  this.send = function(messageObj, callback) {

    if (!this.connected) {
      callback({
        error: 'MicroService connection is down',
        status: {
          code: 503
        }
      });
      return;
    }

    var type = messageObj.type;
    if (callback) {
      if (messageObj.ms_requestId) {
        // add the response handler to the microService handler hash

        ms_response_handlers[messageObj.ms_requestId] = callback;

        //self.once(messageObj.uuid, callback);
        console.log('callback response handler saved for message ' + messageObj.ms_requestId);
      }
      else {

        if (self.hasEventHandler[type] && callback !== self.hasEventHandler[type]) {
          console.log('callback has changed for type ' + type);
          self.removeHandler(type);
        }
        if (!self.hasEventHandler[type]) {
          self.addHandler(type, callback);
          console.log('callback set for type ' + type);
        }
      }
    }
    socket.emit('ewdjs', messageObj);
    if (self.log) console.log('sent: ' + JSON.stringify(messageObj));
  };

  socket.on('disconnect', function() {
    console.log('*** server has disconnected socket, probably because it shut down');
    self.connected = false;
    self.emit('socketDisconnected');
  });

}

var socketClient = function() {

  this.application = 'undefined';
  this.log = false;
  this.token = false;
  events.EventEmitter.call(this);
};

var proto = socketClient.prototype;
proto.__proto__ = events.EventEmitter.prototype;
proto.start = start;

module.exports = socketClient;
