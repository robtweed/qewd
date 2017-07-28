/*

 ----------------------------------------------------------------------------
 | qewd: Quick and Easy Web Development                                     |
 |                                                                          |
 | Copyright (c) 2017 M/Gateway Developments Ltd,                           |
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

  28 July 2017

*/

var events = require('events');
var io = require('socket.io-client');

function start(params) {

  var self = this;

  this.application = params.application || 'undefined';
  this.url = params.url || false;
  this.log = params.log || false;
  this.jwt = params.jwt || false;
  if (!this.url) return;
  this.hasEventHandler = {};

  var socket = io(this.url, {transports: ['websocket']});

  this.on('error', function(message) {
  });

  function handleResponse(messageObj) {
    // messages received back from socket server

    if (messageObj.message && messageObj.message.error && messageObj.message.disconnect) {
      if (typeof socket !== 'undefined') {
        socket.disconnect();
        console.log('Socket disconnected');
      }
      return;
    }

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

    /*
    if (messageObj.message && messageObj.message.error) {
      var ok = self.emit('error', messageObj);
      if (ok) return;
    }
    */

    self.emit(messageObj.type, messageObj);
  }

  socket.on('connect', function() {

    self.disconnectSocket = function() {
      socket.disconnect();
      console.log('qewd-socketClient disconnected socket');
    };
    var message;
    if (self.token) {
      // re-connection occured - re-register to attach to original Session
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
    var type = messageObj.type;
    if (callback) {
      if (self.hasEventHandler[type] && callback !== self.hasEventHandler[type]) {
        console.log('callback has changed for type ' + type);
        self.removeHandler(type);
      }
      if (!self.hasEventHandler[type]) {
        self.addHandler(type, callback);
        console.log('callback set for type ' + type);
      }
    }
    /*
    if (self.token) {
      messageObj.token = self.token;
      socket.emit('ewdjs', messageObj);
      if (self.log) console.log('sent: ' + JSON.stringify(messageObj));
    }
    */
    socket.emit('ewdjs', messageObj);
    if (self.log) console.log('sent: ' + JSON.stringify(messageObj));
  };

  socket.on('disconnect', function() {
    console.log('*** server has disconnected socket, probably because it shut down');
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
