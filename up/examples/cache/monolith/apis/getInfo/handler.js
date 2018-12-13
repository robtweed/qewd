module.exports = function(args, finished) {

  finished({
    info: {
      server: 'QEWD-Up Monolith',
      arch: process.arch,
      platform: process.platform,
      versions: process.versions,
      memory: process.memoryUsage(),
    }
  });
};


