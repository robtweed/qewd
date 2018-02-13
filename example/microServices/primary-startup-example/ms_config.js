
function findRoute(path, routes) {
  for (var index = 0; index < routes.length; index++) {
    if (routes[index].path === path) return index;
  }
}

module.exports = function(routes, ms_hosts) {

  var index = findRoute('/api/patients/:patientId/:heading', routes);

  routes[index].onResponse = function(args) {
    console.log('onResponse handler for /api/patients/:patientId/:heading');
    if (!args.responseObj.message.error) {
      args.handleResponse({
        message: args.responseObj.message.results
      });
      return true;
    }
  };

  index = findRoute('/api/patients/:patientId/:heading/:sourceId', routes);

  routes[index].onResponse = function(args) {
    console.log('onResponse handler for /api/patients/:patientId/:heading/:sourceId');
    if (!args.responseObj.message.error) {
      args.handleResponse({
        message: args.responseObj.message.results
      });
      return true;
    }
  };

  index = findRoute('/api/patients/:patientId', routes);

  routes[index].onResponse = function(args) {
    console.log('onResponse handler for /api/patients/:patientId');
    if (!args.responseObj.message.error) {
      var patientArgs = args.responseObj.message;

      var message = {
        path: '/api/my/headings/synopsis',
        method: 'GET',
        headers: {
          authorization: 'Bearer ' + patientArgs.token
        },
        query: {
          max: 10
        }
      };
      args.send(message, function(responseObj) {
        console.log('response from /api/my/headings/synopsis: ' + JSON.stringify(responseObj));

        //add in fields from patient response

        var demographics = patientArgs.demographics;
        var combiResponse = responseObj.message;

        combiResponse.name = demographics.name;
        combiResponse.gender = demographics.gender;
        combiResponse.dateOfBirth = demographics.dateOfBirth;
        combiResponse.id = demographics.id;
        combiResponse.address = demographics.address;
        combiResponse.pasNumber = demographics.pasNo;
        combiResponse.nhsNumber = demographics.nhsNumber;
        combiResponse.gpName = demographics.gpName;
        combiResponse.gpAddress = demographics.gpAddress;
        combiResponse.telephone = demographics.phone;

        args.handleResponse({
          message: combiResponse
        });
      });
      return true;
    }
  };


  return {
    destinations: {
      authentication_service: {
        host: ms_hosts.authentication_service,
        application: 'ripple-auth'
      },
      hospital_service: {
        host: ms_hosts.hospital_service,
        application: 'ripple-phr-hospital'
      },
      phr_service: {
        host: ms_hosts.phr_service,
        application: 'ripple-phr-openehr'
      }
    },
    routes: routes
  };

  return {
    config: config,
    routes: routes
  };
};
