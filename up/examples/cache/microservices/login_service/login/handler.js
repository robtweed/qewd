module.exports = function(args, finished) {
  var username = args.req.body.username;
  var password = args.req.body.password;
  var jwt = args.session;
  if (username === 'rob' && password === 'secret') {
    jwt.userText = 'Welcome Rob';
    jwt.username = username;
    jwt.authenticated = true;
    jwt.timeout = 1200;
    finished({ok: true});
  }
  else {
    finished({error: 'Invalid login'});
  }
};

