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

  14 July 2017

*/

var sessions = require('ewd-session');
var build = require('./build');
var resilientMode = require('./resilientMode');

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
    if (this.userDefined.config.resilientMode) {
      resilientMode.garbageCollector.call(this);
    }
    var q = this;
    this.db.use = function(documentName, ...subscripts) {
      if (subscripts.length === 1 && Array.isArray(subscripts[0])) subscripts = subscripts[0];
      return new q.documentStore.DocumentNode(documentName, subscripts);
    };
  });

  this.on('start', function(isFirst) {

    // load up dynamic app handler mechanism

    require('./appHandler').call(this);

    // connect Cache or GT.M

    var db = this.userDefined.config.database;
    if (db) {
      var type = db.type;
      if (type === 'cache' || type === 'gtm' || type === 'redis') {
        require('ewd-qoper8-' + type)(this, db.params);
      }
    }
    this.isFirst = isFirst;
  });

  this.setCustomErrorResponse = function(params) {
    var application = params.application;
    if (!application || application === '') return false;
    var type = params.errorType;
    if (!type || type === '') return false;
    var text = params.text || 'Unspecified Error';
    var statusCode = params.statusCode || '400';
    if (!this.errorMessages) this.errorMessages = {};
    if (!this.errorMessages[application]) this.errorMessages[application] = {};
    this.errorMessages[application][type] = {
      text: text,
      statusCode: statusCode
    };
  };

};
