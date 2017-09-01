// Example using variable destinations

// Each store destination would use this module

var router = require('qewd-router');
var routes;

function getStockList(args, finished) {
  // collate the stock list for the store
  console.log('args: ' + JSON.stringify(args));
  var stockListObj = {
    store: args.destination,
    ip: '192.168.1.119',
    stock: 'stock list here...'
  };
  finished(stockListObj);
}

function getStockListByCategory(args, finished) {
  // collate the stock list for the specified category
  var stockListObj = {
    store: args.destination,
    ip: '192.168.1.119',
    category: args.category,
    stock: 'stock list for ' + args.category + ' here...'
  };
  finished(stockListObj);
}

module.exports = {
  
  init: function() {
    routes = {
      '/api/store/:destination/stocklist': {
        GET: getStockList
      },
      '/api/store/:destination/category/:category/stocklist': {
        GET: getStockListByCategory
      }
    };
    router.addMicroServiceHandler(routes, module.exports);
  },

  beforeMicroServiceHandler: function(req, finished) {
    // a valid login must have taken place first!

    return this.jwt.handlers.validateRestRequest.call(this, req, finished);
  }


};
