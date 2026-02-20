/*

 ----------------------------------------------------------------------------
 | qewd: Quick and Easy Web Development                                     |
 |                                                                          |
 | Copyright (c) 2023-26 MGateway Ltd,                                      |
 | Banstead, Surrey UK.                                                     |
 | All rights reserved.                                                     |
 |                                                                          |
 | https://www.mgateway.com                                                 |
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

  20 February 2026

*/

let sessions = require('ewd-session');
let build = require('./build');
let resilientMode = require('./resilientMode');
let qewdSessionByJWT = require('./qewdSessionByJWT');

module.exports = function() {

  this.xpress = {
    build: build
  };

  this.on('DocumentStoreStarted', function() {
    sessions.init(this.documentStore, this.userDefined.config.sessionDocumentName);
    this.sessions = sessions;
    this.jwt = this.userDefined.config.jwt;
    sessions.garbageCollector(this, 60);
    this.handlers = {};
    this.beforeHandlers = {};
    this.afterHandlers = {};
    this.servicesAllowed = {};
    this.qewdSessionByJWT = qewdSessionByJWT;
    if (this.userDefined.config.resilientMode) {
      resilientMode.garbageCollector.call(this);
    }
    let q = this;
    this.db.use = function(documentName, ...subscripts) {
      if (subscripts.length === 1 && Array.isArray(subscripts[0])) subscripts = subscripts[0];
      return new q.documentStore.DocumentNode(documentName, subscripts);
    };
  });

  this.on('start', function(isFirst) {

    // load up dynamic app handler mechanism

    require('./appHandler').call(this);

    // connect Cache, IRIS or YottaDB

    //console.log('worker.js - this.userDefined.config = ' + JSON.stringify(this.userDefined.config, null, 2));
    var db = this.userDefined.config.database;
    if (db) {
      if (!db.params) db.params = {};
      let type = db.type;
      let allowed = ['cache', 'gtm', 'redis', 'iris', 'dbx', 'dbx-napi'];
      if (allowed.includes(type)) {
        if (this.userDefined.config.use_worker_threads && !db.params.host) {
          db.params.multithreaded = true;
        }
        require('ewd-qoper8-' + type)(this, db.params);
      }
    }

    let onWorkerStartedPath = this.userDefined.config.onWorkerStartedPath;
    if (onWorkerStartedPath) {
      try {
        let onWorkerStarted = require(onWorkerStartedPath);
        onWorkerStarted.call(this);
      }
      catch(err) {
        console.log('Unable to invoke the onWorkerStarted hook (' + onWorkerStartedPath + ')');
      }
    }

    this.isFirst = isFirst;
  });

  this.setCustomErrorResponse = function(params) {
    let application = params.application;
    if (!application || application === '') return false;
    let type = params.errorType;
    if (!type || type === '') return false;
    let text = params.text || 'Unspecified Error';
    let statusCode = params.statusCode || '400';
    if (!this.errorMessages) this.errorMessages = {};
    if (!this.errorMessages[application]) this.errorMessages[application] = {};
    this.errorMessages[application][type] = {
      text: text,
      statusCode: statusCode
    };
  };

};
