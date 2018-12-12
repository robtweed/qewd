module.exports = function() {
  console.log('*** onStarted has fired! this properties: ***');
  for (var name in this) {
    console.log(name);
  }
  console.log('=============');

  var config = this.userDefined.config;
  console.log('config - in onStarted: ' + JSON.stringify(config));

  console.log('this.userDefined - in onStarted: ' + JSON.stringify(this.userDefined));

  config.addMiddleware = function(bp, express, q) {
    bodyParser = bp;
    app = express;
  };

};
