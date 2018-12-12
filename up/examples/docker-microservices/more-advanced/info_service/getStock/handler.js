module.exports = function(args, finished) {
  console.log('*** getStock');

  finished({
    product: 'Widgets',
    quantity: process.pid
  });
};


