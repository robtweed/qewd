/*!

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

  31 July 2017

*/

var jwt = require('jwt-simple');
var crypto = require('crypto');
var algorithm = 'aes-256-ctr';

function decrypt(text, secret) {
  var decipher = crypto.createDecipher(algorithm, secret)
  var dec = decipher.update(text,'hex','utf8')
  dec += decipher.final('utf8');
  return dec;
}

function encrypt(text, secret) {
  var cipher = crypto.createCipher(algorithm, secret);
  var crypted = cipher.update(text,'utf8','hex');
  crypted += cipher.final('hex');
  return crypted;
}

function masterRequest(data, socket, handleResponse) {

  console.log('JWT token = ' + data.token);
  console.log('secret = ' + this.jwt.secret);
  var payload;
  var q = this;
  if (this.jwt && this.jwt.secret) {
    try {
      payload = jwt.decode(data.token, this.jwt.secret);
    }
    catch(err) {
      socket.emit('ewdjs', {
        type: data.type,
        message: {
          error: 'Invalid JWT: ' + err,
          disconnect: true
        }
      });
      return;
    }
  }
  else {
    // QEWD has not been started with JWT support turned on

    socket.emit('ewdjs', {
      type: data.type,
      message: {
        error: 'QEWD has not been configured to support JWTs',
        disconnect: true
      }
    });
    return;
  }

  // JWT is OK, so proceed

  console.log('*** jwt decoded: ' + JSON.stringify(payload));
  data.jwt = true;  // used by worker appHandler.js to recognise this as a JWT-based request

  // is the incoming request to be handled locally or remotely using a registered microservice?

  var application = payload.application;
  if (this.u_services && this.u_services.byApplication[application] && this.u_services.byApplication[application][data.type]) {

    console.log('incoming request for ' + application + ': ' + data.type + ' will be handled by microservice');

    // if application has a microservice defined for the incoming message type, 
    //  re-direct it to the handling server
    //  handle the response using handleResponse()
    //  and return

    // need to rewrite the JWT to change to the micro-service system's application name

    var socketClient = this.u_services.byApplication[application][data.type];

    if (payload.application !== socketClient.application) {
      payload.application = socketClient.application;
      data.token = jwt.encode(payload, this.jwt.secret);
    }

    console.log('socketClient sending: ' + JSON.stringify(data));
    socketClient.client.send(data, function(responseObj) {
      if (!responseObj.message.error) {
        if (responseObj.message.token) {
          // reset the response JWT's application back to the one used in the original incoming JWT
          var payload = jwt.decode(responseObj.message.token, null, true);
          if (payload.application !== application) {
            payload.application = application;
            responseObj.message.token = jwt.encode(payload, q.jwt.secret);
          }
        }
      }
      handleResponse(responseObj);         
    });
    return;
  }
  else {
    // handle the request locally
    
    //  send to worker process for handling - see appHandler.js

    this.handleMessage(data, handleResponse);
  }
}

function register(messageObj) {

  if (!this.jwt) {
    // QEWD isn't running with JWTs enabled
    delete messageObj.jwt;
    return {
      error: 'Application expects to use JWTs, but QEWD is not running with JWT support turned on',
      disconnect: true
    };
  }

  return {token: createJWT.call(this, messageObj)};
}

function reregister(payload, messageObj) {
  payloadsocketId = messageObj.socketId;
  var token = updateJWT.call(this, payload);
  return {
    ok: true,
    token: token
  };
}

function createJWT(messageObj) {

  var now = Math.floor(new Date().getTime()/1000);
  var timeout = this.userDefined.config.initialSessionTimeout;

  var payload = {
    exp: now + timeout,
    iat: now,
    iss: 'qewd.jwt',
    application: messageObj.application,
  };

  var secretData = {
    socketId: messageObj.socketId,
    ipAddress: messageObj.ipAddress,
    timeout: timeout,
    authenticated: false
  };

  payload.qewd = encrypt(JSON.stringify(secretData), this.jwt.secret);

  return jwt.encode(payload, this.jwt.secret);
}

function validate(messageObj) {
  //console.log('** validate using JWT: ' + messageObj.token);
  
  try {
    var payload = jwt.decode(messageObj.token, this.jwt.secret);
  }
  catch(err) {
    return {
      error: 'Invalid JWT: ' + err,
      status: {
        code: 403,
        text: 'Forbidden'
      }
    };
  }
  // extract the secret data

  var dec = decrypt(payload.qewd, this.jwt.secret);
  try {
    payload.qewd = JSON.parse(dec);
    payload.qewd_list = {};
    for (var name in payload.qewd) {
      // transfer into payload top-level for back-end use
      // (will be removed again before returning updated JWT to client)

      if (!payload[name]) {
        payload[name] = payload.qewd[name];
        payload.qewd_list[name] = true;
      }
    }
  }
  catch(err) {
    // leave enc property alone
  }

  // add JWT session helper functions

  payload.makeSecret = function(name) {
    payload.qewd_list[name] = true;
  }
  payload.isSecret = function(name) {
    if (payload.qewd_list[name] === true) return true;
    return false;
  }
  payload.makePublic = function(name) {
    delete payload.qewd_list[name];
  }
  console.log('*** session payload = ' + JSON.stringify(payload));
  return {
    session: payload
  };
}

function updateJWT(payload) {

  var timeout = payload.qewd.timeout;

  console.log('updateJWT: payload = ' + JSON.stringify(payload));

  if (payload.qewd) {
    for (var name in payload.qewd_list) {
      console.log('qewd_list ' + name);
      // transfer qewd-only values into qewd property for encryption
      if (typeof payload[name] !== 'undefined') {
        console.log('updateJWT: name = ' + name + '; value = ' + payload[name]);
        payload.qewd[name] = payload[name];
        delete payload[name];
      }
    }
    // encrypt the secret data and save as payload.qewd
    payload.qewd = encrypt(JSON.stringify(payload.qewd), this.jwt.secret);

    // remove the helper functions from the payload/session

    delete payload.qewd_list;
    delete payload.makeSecret;
    delete payload.makePublic;
    delete payload.isSecret;
  }

  // update the expiry time

  var now = Math.floor(new Date().getTime()/1000);
  payload.iat = now;
  payload.exp = now + timeout;
  var token = jwt.encode(payload, this.jwt.secret);
  return token;
};

module.exports = {
  masterRequest: masterRequest,
  register: register,
  reregister: reregister,
  createJWT: createJWT,
  updateJWT: updateJWT,
  validate: validate
};
