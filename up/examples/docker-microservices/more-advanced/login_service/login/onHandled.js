module.exports = function(message, jwt, forward, sendBack) {
  console.log('*** /api/login onHandled ! ***');

  var msg = {
    path: '/api/info/demographics',
    method: 'GET'
  };
  forward(msg, jwt, function(responseObj) {
    sendBack(responseObj);
  });
};
