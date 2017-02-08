module.exports = {
  handlers: {
    testButton: function(messageObj, session, send, finished) {
      console.log('*** handling the button click message!');
      session.data.$('foo').value = 'bar';
      finished({
        ok: 'testButton message was processed successfully!'
      });
    }
  }
};
