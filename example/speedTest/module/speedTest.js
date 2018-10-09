module.exports = {

  handlers: {
    runTest: function(messageObj, session, send, finished) {
      var max = messageObj.params.max || 10000;

      var gloName = 'qewdSpeedTest';

      var node = {
        global: gloName
      };
      this.db.kill(node);
      var start = Date.now();

      for (var i = 0; i < max; i++) {
        node = {
          global: gloName,
          subscripts: [i],
          data: Date.now()
        };
        this.db.set(node);
      }
      var finish = Date.now();
      var elap = (finish - start) / 1000;

      node = {
        global: gloName
      };
      this.db.kill(node);

      finished({
        max: max,
        elap: elap,
        nodesPerSec: max/elap
      });
    }
  }

};