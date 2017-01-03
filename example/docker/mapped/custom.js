function customise(config, q, intercept) {
  console.log('*** This is the custom function calling!');
}

module.exports = {
  run: customise,
  config: {
    serverName: 'Robs QEWD Docker Appliance',
    poolSize: 2
  }
};