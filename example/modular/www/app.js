/*

 ----------------------------------------------------------------------------
 | qewd: Quick and Easy Web Development                                     |
 |                                                                          |
 | Copyright (c) 2023 MGateway Ltd,                                         |
 | Banstead, Surrey UK.                                                     |
 | All rights reserved.                                                     |
 |                                                                          |
 | https://www.mgateway.com                                                 |
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

  Demonstration QEWD application, accessing the VistA EHR
  using its RPCs

*/

var EWD = require('ewd-client').EWD;
var io = require('socket.io-client')
var jQuery = require('jquery');
window.$ = window.jQuery = jQuery;
require('bootstrap');
var login = require('vista-login/client/login');
var toastr = require('toastr');

$(document).ready(function() {
  EWD.on('ewd-registered', function() {
    EWD.log = true;
    var params = {
      service: 'vista-login',
      name: 'login.html',
      targetId: 'loginPanel'
    };
    EWD.getFragment(params, function() {
      login(EWD, function(responseObj) {
        console.log('*** logged in!');
        $('#welcomePanel').text(responseObj.message.greeting);
        toastr.success(responseObj.message.greeting);
      });
    });

  });

  EWD.on('error', function(responseObj) {
    // automatically display all returned errors using toastr
    var error = responseObj.message.error || responseObj.message;
    toastr.error(error);
  });

  /*
     alternative using an emitted event

  EWD.on('loggedIn', function(responseObj) {
    console.log('*** logged in!');
    $('#welcomePanel').text(responseObj.message.greeting);
    toastr.success(responseObj.message.greeting);
  });

  */

  EWD.start('vista', jQuery, io);
});


