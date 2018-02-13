var config = require('./startup_config.json');
var ms_hosts = require('./ms_hosts.json');
var ms_routes = require('./ms_routes.json');
var local_routes = require('./local_routes.json');
config.jwt = require('./jwt_secret.json');
var ms_config = require('./ms_config');
var customiseRoutes = require('./customiseRoutes');

config.u_services = ms_config(ms_routes, ms_hosts);
var routes = customiseRoutes(local_routes, config);

module.exports = {
  config: config,
  routes: routes
};
