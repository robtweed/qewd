/*

 ----------------------------------------------------------------------------
 | qewd: Quick and Easy Web Development                                     |
 |                                                                          |
 | Copyright (c) 2017 M/Gateway Developments Ltd,                           |
 | Reigate, Surrey UK.                                                      |
 | All rights reserved.                                                     |
 |                                                                          |
 | http://www.mgateway.com                                                  |
 | Email: rtweed@mgateway.com                                               |
 |                                                                          |
 |                                                                          |
 | Licensed under the Apache License, Version 2.0 (the "License");          |
 | you may not use this file except in compliance with the License.         |
 | You may obtain a copy of the License at                                  |
 |                                                                          |
 |     http://www.apache.org/licenses/LICENSE-2.0                           |
 |                                                                          |
 | Unless required by applicable law or agreed to in writing, software      |
 | distributed under the License is distributed on an "AS IS" BASIS,        |
 | WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. |
 | See the License for the specific language governing permissions and      |
 |  limitations under the License.                                          |
 ----------------------------------------------------------------------------

  3 January 2017

*/

var fs = require('fs');
var customModulePath = '/opt/qewd/mapped/custom.js';
var routesModulePath = '/opt/qewd/mapped/routes.js';
var custom;
var routes;
if (fs.existsSync(customModulePath)) {
  custom = require(customModulePath);
}
if (fs.existsSync(routesModulePath)) {
  var routes = require(routesModulePath);
}
if (!routes) routes = [];

if (!custom) {
  custom = {
    config: {},
    run: function() {}
  };
}

if (custom && !custom.config) custom.config = {};
if (custom && !custom.run) custom.run = function() {};

var config = {
  managementPassword: custom.config.managementPassword || 'keepThisSecret!',
  serverName: custom.config.serverName || 'EWD Docker Server',
  port: custom.config.port || 8080,
  poolSize: custom.config.poolSize || 1,
  database: {
    type: 'redis',
    params: {
      host: process.env.REDIS_PORT_6379_TCP_ADDR,
      port: process.env.REDIS_PORT_6379_TCP_PORT
    }
  }
};

var qewd = require('qewd').master;
var q = qewd.start(config, routes);
var intercept = qewd.intercept();

custom.run(config, q, intercept);
