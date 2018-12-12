module.exports = function(req, finished) {
  console.log('*** beforeHandler! ***');
  var status = this.jwt.handlers.validateRestRequest.call(this, req, finished);
  return status;
};
