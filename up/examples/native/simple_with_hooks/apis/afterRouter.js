module.exports = [(req, res, next) => {
  console.log('*** afterRouter ***');
  var messageObj = res.locals.message || {error: 'Not Found'};
  if (messageObj.error) {
    var code = 400;
    var status = messageObj.status;
    if (status && status.code) code = status.code;
    delete messageObj.status;
    delete messageObj.restMessage;
    delete messageObj.ewd_application;
    console.log('afterRouter for ' + req.originalUrl + ' sending an error response: ' + JSON.stringify(messageObj));
    res.set('content-length', messageObj.length);
    res.status(code).send(messageObj);
  }
  else {
    res.send(messageObj);
  }
  next();
}];