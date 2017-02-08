module.exports = {

  restModule: true,

  handlers: {
    test: function(messageObj, finished) {
      finished({foo: 'bar'});
    }
  }

};
