module.exports = function() {
  console.log('*** Orchestrator onStarted has fired! this properties: ***');
  for (var name in this) {
    console.log(name);
  }
};
