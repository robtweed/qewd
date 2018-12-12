module.exports = function(args, finished) {

  finished({
    info: {
      server: 'native qewd-up',
      arch: process.arch,
      platform: process.platform,
      versions: process.versions,
      memory: process.memoryUsage(),
    }
  });
};


