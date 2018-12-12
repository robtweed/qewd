module.exports = function(req, finished) {
  console.log('*** beforeHandler! ***');
  console.log('properties of this in beforeHandler:');
  for (var name in this) {
    console.log(name);
  }
};
