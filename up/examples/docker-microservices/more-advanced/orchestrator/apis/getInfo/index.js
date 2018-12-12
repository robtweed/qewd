module.exports = function(args, finished) {

  finished({
    info: {
      server: 'orchestrator',
      arch: process.arch,
      platform: process.platform,
      versions: process.versions,
      memory: process.memoryUsage(),
    }
  });
};


