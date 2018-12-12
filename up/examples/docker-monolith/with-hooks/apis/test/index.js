console.log('loading test');

module.exports = function(args, finished) {

  var doc = this.db.use('test');
  var index = doc.$('index').increment();
  doc.$(['data', index]).setDocument({
    time: Date.now(),
    pid: process.pid
  });

  finished({
    test: {
      ok: true
    }
  });
};


