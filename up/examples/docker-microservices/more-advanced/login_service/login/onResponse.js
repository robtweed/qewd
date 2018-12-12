module.exports = function(args) {
  console.log('*** login onResponse  ****');

  // use args.handleResponse to repackage / reformat the response and send it to client

  // use args.send to forward a new request to a microservice

  // onResponse function MUST return true if you use either of the above

  // eg:

  /*
    if (!args.responseObj.message.error) {
      var respObj = {
        yousent: args.message.path,
        usingMethod: args.message.method,
      };
      args.handleResponse(respObj);
      return true;
    }
  */

};
