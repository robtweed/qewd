console.log('loading info/getInfo');

module.exports = function(args, finished) {
  console.log('*** getInfo args: ' + JSON.stringify(args, null, 2));

  finished({
    info: {
      server: 'info_service',
      arch: process.arch,
      platform: process.platform,
      versions: process.versions,
      memory: process.memoryUsage(),
    }
  });
};


