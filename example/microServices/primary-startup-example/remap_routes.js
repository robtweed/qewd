module.exports = {

  '/api/auth/demo': {
    to: function() {
      // this isn't allowed except as a redirected path, so force an error:

      return '/api/invalid';
    }
  },

  '/api/initialise': {

    to: function(config) {

      if (config.ripple_mode === 'demo') return '/api/auth/demo';

      return '/api/auth/login';
    },

    onResponse: function(responseObj) {
      // repackage response object and return it

      console.log('repackaging response for /api/initialise');

      // https://rippleosi.eu.auth0.com/authorize
      //   ?scope=openid profile email
      //   &response_type=code
      //   &connections[0]=Username-Password-Authentication
      //   &connections[1]=google-oauth2
      //   &connections[2]=twitter
      //   &sso=true
      //   &client_id=Ghi91Wk1PERQjxIN5ili6rssnl4em8In
      //   &redirect_uri=http://www.mgateway.com:8080/api/auth/token
      //      &auth0Client=eyJuYW1lIjoicWV3ZC1jbGllbnQiLCJ2ZXJzaW9uIjoiMS4yNi4wIn0=


      if (responseObj.authenticated) {
        // map back to what /api/initialised would have sent
        return {
          ok: true,
          mode: 'secure'
        };
      }

      return responseObj;

      //responseObj.redirectTo = 'openid';
      //return responseObj;

    }
  }
};