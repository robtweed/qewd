module.exports = function(args, finished) {
  console.log('*** demographics args: ' + JSON.stringify(args, null, 2));

  finished({
    name: 'Rob Tweed',
    city: 'Redhill'
  });
};


