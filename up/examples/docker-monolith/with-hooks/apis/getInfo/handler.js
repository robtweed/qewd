var find = require('a-find');

module.exports = function(args, finished) {

  var result = find(['a', 'b', 'c', 'd', 'c'], 'c');

  finished({
    info: {
      server: 'QEWD-Monolith',
      arch: process.arch,
      platform: process.platform,
      versions: process.versions,
      memory: process.memoryUsage(),
    },
    result: result
  });
};


