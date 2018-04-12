/*!

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

  12 April 2018

*/

var jwt = require('jwt-simple');
var crypto = require('crypto');
//var algorithm = 'aes-256-ctr';
var algorithm = 'aes-256-cbc';
var key;
var iv;

function sizes(cipher) {
  for (let nkey = 1, niv = 0;;) {
    try {
      crypto.createCipheriv(cipher, '.'.repeat(nkey), '.'.repeat(niv));
      return [nkey, niv];
    } catch (e) {
      if (/invalid iv length/i.test(e.message)) niv += 1;
      else if (/invalid key length/i.test(e.message)) nkey += 1;
      else throw e;
    }
  }
}

function compute(cipher, passphrase) {
  let [nkey, niv] = sizes(cipher);
  for (let key = '', iv = '', p = '';;) {
    const h = crypto.createHash('md5');
    h.update(p, 'hex');
    h.update(passphrase);
    p = h.digest('hex');
    let n, i = 0;
    n = Math.min(p.length-i, 2*nkey);
    nkey -= n/2, key += p.slice(i, i+n), i += n;
    n = Math.min(p.length-i, 2*niv);
    niv -= n/2, iv += p.slice(i, i+n), i += n;
    if (nkey+niv === 0) return [key, iv];
  }
}

function decrypt(text, secret) {
  if (!key) {
    var results = compute(algorithm, secret);
    key = Buffer.from(results[0], 'hex');
    iv = Buffer.from(results[1], 'hex');
  }
  var decipher = crypto.createDecipheriv(algorithm, key, iv)
  var dec = decipher.update(text,'hex','utf8')
  dec += decipher.final('utf8');
  return dec;
}

function encrypt(text, secret) {
  if (!key) {
    var results = compute(algorithm, secret);
    key = Buffer.from(results[0], 'hex');
    iv = Buffer.from(results[1], 'hex');
  }
  var cipher = crypto.createCipheriv(algorithm, key, iv);
  var crypted = cipher.update(text,'utf8','hex');
  crypted += cipher.final('hex');
  return crypted;
}

function decodeJWT(token) {
  try {
    return {payload: jwt.decode(token, this.jwt.secret)};
  }
  catch(err) {
    return {error: 'Invalid JWT: ' + err};
  }
}

function encodeJWT(payload) {
  return jwt.encode(payload, this.jwt.secret);
}

function decodeJWTInWorker(jwt, callback) {
  // decode / test the incoming JWT in a worker (to reduce master process CPU load)
  var msg = {
    type: 'ewd-jwt-decode',
    params: {
      jwt: jwt
    }
  };
  this.handleMessage(msg, callback);
}

function encodeJWTInWorker(payload, callback) {
  // encode the updated JWT in a worker (to reduce master process CPU load)
  var msg = {
    type: 'ewd-jwt-encode',
    params: {
      payload: payload
    }
  };
  this.handleMessage(msg, callback);
}

function sendToMicroService(socketClient, data, application, handleResponse) {
  var q = this;
  //console.log('socketClient sending: ' + JSON.stringify(data));
  socketClient.client.send(data, function(responseObj) {
    if (!responseObj.message.error) {
      if (responseObj.message.token) {
        // reset the response JWT's application back to the one used in the original incoming JWT
        var payload = jwt.decode(responseObj.message.token, null, true);  // simple base64 decode
        if (payload.application !== application) {
          payload.application = application;
          encodeJWTInWorker.call(q, payload, function(jwtObj) {
            responseObj.message.token = jwtObj.message.jwt;
            handleResponse(responseObj);
          });
          return;
        }
      }
    }
    handleResponse(responseObj);         
  });
}

function masterRequest(data, socket, handleResponse) {

  // This runs in the master process, invoked by sockets.js

  var q = this;
  if (this.jwt && this.jwt.secret) {

    // decode / test the incoming JWT in a worker (to reduce master process CPU load)

    decodeJWTInWorker.call(this, data.token, function(responseObj) {
      if (responseObj.message.error) {
        socket.emit('ewdjs', {
          type: data.type,
          message: {
            error: responseObj.error,
            disconnect: true
          }
        });
        return;
      }

      // incoming JWT was OK

      data.jwt = true;  // used by worker appHandler.js to recognise this as a JWT-based request

      // is the incoming request to be handled locally or remotely using a registered microservice?
      console.log('decodeJWTInWorker - responseObj = ' + JSON.stringify(responseObj));
      var payload = responseObj.message.payload;
      var application = payload.application;
      if (q.u_services && q.u_services.byApplication[application] && q.u_services.byApplication[application][data.type]) {

        if (q.log) console.log('incoming request for ' + application + ': ' + data.type + ' will be handled by microservice');

        // if application has a microservice defined for the incoming message type, 
        //  re-direct it to the handling server
        //  handle the response using handleResponse()
        //  and return

        // need to rewrite the JWT to change to the micro-service system's application name

        var socketClient = q.u_services.byApplication[application][data.type];

        if (payload.application !== socketClient.application) {
          payload.application = socketClient.application;

          // encode the updated JWT in a worker (to reduce master process CPU load)

          encodeJWTInWorker.call(q, payload, function(responseObj) {
            data.token = responseObj.message.jwt;
            sendToMicroService.call(q, socketClient, data, application, handleResponse)
          });
        }
        else {
          sendToMicroService.call(q, socketClient, data, application, handleResponse)
        }
      }
      else {
        // handle the request locally
    
        //  send to worker process for handling - see appHandler.js

        q.handleMessage(data, handleResponse);
      }
    });
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

function createUServiceSession(messageObj) {
  return createRestSession.call(this, {
    req: {
      application: messageObj.application,
      ip: messageObj.ip
    }
  });
}

function createRestSession(args) {
  var now = Math.floor(Date.now()/1000);
  var timeout = this.userDefined.config.initialSessionTimeout;

  var payload = {
    exp: now + timeout,
    iat: now,
    iss: 'qewd.jwt',
    application: args.req.application,
    ipAddress: args.req.ip,
    timeout: timeout,
    authenticated: false,
    qewd: {
    },
    qewd_list: {
      ipAddress: true,
      authenticated: true
    }
  };

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
  return payload;

}

function createJWT(messageObj) {

  var now = Math.floor(Date.now()/1000);
  var timeout = this.userDefined.config.initialSessionTimeout;

  var payload = {
    exp: now + timeout,
    iat: now,
    iss: 'qewd.jwt',
    application: messageObj.application,
    timeout: timeout
  };

  var secretData = {
    socketId: messageObj.socketId,
    ipAddress: messageObj.ipAddress,
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
  //console.log('*** session payload = ' + JSON.stringify(payload));
  return {
    session: payload
  };
}

function getProperty(propertyName, token) {
  var payload;
  try {
    payload = jwt.decode(token, null, true);
  }
  catch(err) {
    return false;
  }
  if (!payload[propertyName]) return false;
  return payload[propertyName];
}

function updateJWTExpiry(token, application) {
  try {
    var payload = jwt.decode(token, null, true);
  }
  catch(err) {
    return false;
  }

  // update the expiry time

  //console.log('*** updating expiry for payload ' + JSON.stringify(payload));

  var now = Math.floor(Date.now()/1000);
  payload.iat = now;
  payload.exp = now + payload.timeout || 300;
  if (application && application !== '') payload.application = application;
  //console.log('JWT expiry updated - now = ' + now + '; exp = ' + payload.exp);
  token = jwt.encode(payload, this.jwt.secret);
  return token;
}

function updateJWT(payload) {

  var timeout = payload.timeout;

  //console.log('updateJWT: payload = ' + JSON.stringify(payload));

  if (payload.qewd) {
    for (var name in payload.qewd_list) {
      //console.log('qewd_list ' + name);
      // transfer qewd-only values into qewd property for encryption
      if (typeof payload[name] !== 'undefined') {
        //console.log('updateJWT: name = ' + name + '; value = ' + payload[name]);
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

  var now = Math.floor(Date.now()/1000);
  payload.iat = now;
  payload.exp = now + timeout;
  var token = jwt.encode(payload, this.jwt.secret);
  return token;
};


function validateRestRequest(messageObj, finished, bearer, checkIfAuthenticated) {
  if (checkIfAuthenticated !== false) checkIfAuthenticated = true;  // has to be explicitly false to override
  var jwt = getRestJWT(messageObj, bearer);
  if (jwt === '') {
    finished({error: 'Authorization Header missing or JWT not found in header (expected format: Bearer {{JWT}}'});
    return false;
  }
  //console.log('**** jwt = ' + jwt);
  var status = validate.call(this, {token: jwt});
  if (status.error) {
    finished(status);
    return false;
  }
  if (checkIfAuthenticated && !status.session.authenticated) {
    finished({error: 'User is not authenticated'});
    return false;
  }
  messageObj.session = status.session;
  return true;
}

function getRestJWT(messageObj, bearer) {
  var jwt = '';
  if (messageObj.headers && messageObj.headers.authorization) {
    jwt = messageObj.headers.authorization;
    if (bearer !== false) {
      jwt = jwt.split('Bearer ')[1];
      if (typeof jwt === 'undefined') jwt = '';
    }
  }
  return jwt;
}

function isTokenAPossibleJWT(token) {
  var pieces = token.split('.');
  if (pieces.length !== 3) return false;
  if (pieces[0].length < 2) return false;
  if (pieces[1].length < 2) return false;
  if (pieces[2].length < 2) return false;
  return true;
}

function isJWTValid(token, noVerify) {
  try {
    var payload = jwt.decode(token, this.jwt.secret, noVerify);
    if (noVerify) {
      if (payload.exp && payload.exp < (Date.now()/1000)) {
        return {
          ok: false,
          error: 'Invalid JWT: Token expired'
        };
      }
    }
    return {ok: true};
  }
  catch(err) {
    return {
      ok: false,
      error: 'Invalid JWT: ' + err
    };
  }
}

module.exports = {
  masterRequest: masterRequest,
  register: register,
  reregister: reregister,
  createJWT: createJWT,
  createRestSession: createRestSession,
  updateJWT: updateJWT,
  setJWT: updateJWT,
  validate: validate,
  getRestJWT: getRestJWT,
  validateRestRequest: validateRestRequest,
  updateJWTExpiry: updateJWTExpiry,
  isJWTValid: isJWTValid,
  createUServiceSession: createUServiceSession,
  decodeJWT: decodeJWT,
  encodeJWT: encodeJWT,
  getProperty: getProperty
};
