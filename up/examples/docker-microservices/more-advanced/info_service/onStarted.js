module.exports = function() {
  console.log('*** onStarted has fired! this properties: ***');
  for (var name in this) {
    console.log(name);
  }
};
