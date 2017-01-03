module.exports = {

  restModule: true,

  handlers: {
    api1: function(messageObj, finished) {
      finished({foo: 'bar'});
    }
  }

};
