/*

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

  3 January 2017

  Back-end module for handling GraphQL over HTTP

*/

var graphql = require('graphql').graphql;
var defaultSchema = require('myGQLSchema-es6').Schema;
var sessions = require('ewd-session');

module.exports = {

  restModule: true,

  handlers: {

    login: function(messageObj, finished) {

      if (messageObj.method !== 'POST') {
        finished({error: 'Only POST requests are accepted'});
        return;
      }

      var username = messageObj.body.username;
      if (username === '') {
        finished({error: 'You must enter a username'});
        return;
      }
      var password = messageObj.body.password;
      if (password === '') {
        finished({error: 'You must enter a password'});
        return;
      }
      if (username !== 'rob') {
        finished({error: 'Invalid username'});
        return;
      }
      if (password !== 'secret') {
        finished({error: 'Invalid password'});
        return;
      }
      // login credentials OK - create EWD session

      var session = sessions.create(messageObj.application, 1200);
      session.authenticated = true;
      session.data.$('username').value = username;
      finished({token: session.token});
    },

    query: function(messageObj, finished) {

      if (messageObj.method !== 'POST') {
        finished({error: 'Only POST requests are accepted'});
        return;
      }
      if (messageObj.headers.authorization) {
        // authenticate against EWD Session token

        var result = sessions.authenticate(messageObj.headers.authorization, 'noCheck');
        if (result.error) {
          finished({
            error: result.error
          });
          return;
        }
        var session = result.session;
        if (!session.authenticated || session.application !== 'graphql-rest') {
          finished({
            error: 'Invalid session'
          });
          return;
        }

        // OK to invoke the GraphQL query

        var query = messageObj.body;
        var schema;
        if (messageObj.query.schema) {
          try {
            schema = require(messageObj.query.schema).Schema;
          }
          catch(err) {
            finished({
              error: 'Unable to load schema ' + messageObj.query.schema
            });
            return;
          }
        }
        else {
          schema = defaultSchema;
        }
        var context = {
          q: this, 
          session: session
        }
        graphql(schema, query, null, context).then(result => {
          console.log(result);
          finished({
            ok: true, 
            result: result
          });
        });
      }
      else {
        finished({error: 'Missing authorization token'});
      }
    }

  }

};
