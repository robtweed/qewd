/*

  Example QEWD micro-service for handling logins

*/


module.exports = {

  handlers: {
    login: function(messageObj, session, send, finished) {
      var username = messageObj.params.username;
      var password = messageObj.params.password;
      if (username === 'rob' && password === 'secret') {
        session.userText = 'Rob';
        session.username = username;
        session.authenticated = true;
        session.timeout = 60;

        session.makeSecret('username');
        session.makeSecret('authenticated');

        return finished({ok: true});
      }
      else {
        return finished({error: 'Invalid login'});
      }
    }
  }

};