/*

 ----------------------------------------------------------------------------
 | vista-login: Demonstraion of modular vista system using QEWD             |
 |                                                                          |
 | Copyright (c) 2016 M/Gateway Developments Ltd,                           |
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

*/
  
var sessions = require('ewd-session');
var runRPC = require('ewd-qoper8-vistarpc/lib/proto/runRPC');

/*
      how to fetch the welcome message manually:

        getWelcome: function(messageObj, session, send, finished) {
          var introNode = new this.documentStore.DocumentNode('XTV',[8989.3,1,"INTRO"]);
          var intro = introNode.getDocument(true);   
          var lines = intro[0].split('^')[3];
          var output = [];
          for (var i = 1; i <= lines; i++) {
            var line = intro[i][0];
            output.push(line);
          }
          finished(output);
        }
*/
  

module.exports = {

  handlers: {

    login: function(messageObj, session, send, finished) {

      if (session.authenticated) {
        finished({error: 'You are already logged into VistA'});
        return;
      }

      var accessCode = messageObj.params.ac;
      var verifyCode = messageObj.params.vc;
      if (accessCode === '') {
        finished({error: 'You must enter an access code'});
        return;
      }
      if (verifyCode === '') {
        finished({error: 'You must enter a verify code'});
        return;
      }

      var params = {
        rpcName: 'XUS SIGNON SETUP'
      };
      // Don't save the symbol table yet!

      var response = runRPC.call(this, params, session, false);
  
      params = {
        rpcName: 'XUS AV CODE',
        rpcArgs: [{
          type: 'LITERAL',
          value: accessCode + ';' + verifyCode
        }],
      };

      var response = runRPC.call(this, params, session, false);
      console.log('login response: ' + JSON.stringify(response));
      var values = response.value;
      var duz = values[0];
      var err = values[3]
      if (duz.toString() === '0' && err !== '') {
        finished({error: err});
      }
      else {
        // logged in successfully

        // save symbol table to session...

        ok = this.db.symbolTable.save(session);
        // clean up the back-end Cache/GT.M process:
        ok = this.db.symbolTable.clear();

        // ** important! flag the user as authenticated to prevent unauthorised access to RPCs by a user before they log in

        session.authenticated = true;

        // return response

        var greeting = values[7];
        var pieces = greeting.split(' ');
        pieces = pieces.splice(2, pieces.length);
        var displayName = pieces.join(' ');

        var results = {
          displayName: displayName,
          greeting: greeting,
          lastSignon: values[8],
          messages: values.splice(8, values.length)
        };
        // Note that we DON'T return the DUZ!
        finished(results);
      }
    },

    RPC: function(messageObj, session, send, finished) {

      if (!this.db.symbolTable) this.db.symbolTable = sessions.symbolTable(this.db);

      var rpcName = messageObj.params.rpcName;
      if (rpcName === 'XUS SIGNON SETUP' || rpcName === 'XUS AV CODE') {
        // have to use the login handler for these RPCs
        finished({error: rpcName + ' RPC cannot be invoked directly'});
        return;
      }
      var manageSymbolTable = false;      
      if (rpcName !== 'XUS INTRO MSG') {
        if (!session.authenticated) {
          finished({error: 'You have not been authenticated on VistA'});
          return;
        }
        manageSymbolTable = true;
      }

      var results = runRPC.call(this, messageObj.params, session, manageSymbolTable);

      if (manageSymbolTable) {
         // clean up the back-end Cache/GT.M process:
         this.db.symbolTable.clear();
      }
      finished(results);
    }

  }
};
