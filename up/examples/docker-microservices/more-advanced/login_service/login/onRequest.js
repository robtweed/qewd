module.exports = function(args, send, handleResponse) {
  console.log('*** login onRequest handler ***');

  if (args.req.query.bypass) {

    handleResponse({
      message: {
        login: 'bypassed'
      }
    });
  }
  else if (args.req.query.info) {
    var message = {
      path: '/api/info/info',
      method: 'GET'
    };
    send(message, args, handleResponse);
  }

  else {
    return false; // ignore onRequest and continue to login handler
  }

};