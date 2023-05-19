/*!

 ----------------------------------------------------------------------------
 | qewd: Quick and Easy Web Development                                     |
 |                                                                          |
 | Copyright (c) 2023 MGateway Ltd,                                         |
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

  19 November 2018

*/

module.exports = function(req) {
  var uid = req.session.uid;
  if (typeof uid === 'undefined') return;
  //console.log('uid = ' + uid);
  var qewdSession = this.sessions.byToken(uid);
  if (!qewdSession) {
    // New JWT - create a new QEWD Session for it

    //console.log('**** application: ' + req.application + '; timeout: ' + req.session.timeout);
    qewdSession= this.sessions.create(req.application, req.session.timeout);
    var token = qewdSession.token;
    //console.log('token = ' + token);

    // swap QEWD Session token with JWT uid value
    var sessionDocName = this.userDefined.config.sessionDocumentName;
    var sessionGlo = this.db.use(sessionDocName);
    var sessionRec = sessionGlo.$(['session', qewdSession.id]);
    var sessionIndex = sessionGlo.$('sessionsByToken');
    sessionRec.$(['ewd-session', 'token']).value = uid;
    sessionIndex.$(uid).value = qewdSession.id;
    sessionIndex.$(token).delete();
  }
  else {
    console.log('QEWD Session ' + qewdSession.id + ' exists for uid ' + uid);
  }
  return qewdSession;
};
