module.exports = function(args, finished) {

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


