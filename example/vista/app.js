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

  Demonstration ewd-xpress application, accessing the VistA EHR
  using its RPCs

*/

function login() {
  console.log('login loaded');

  $('#loginBtn').click(function(e) {

    // Login button has been clicked - try to login to VistA...

    e.preventDefault();
    var ac = $('#username').val();
    var vc = $('#password').val();
    if (ac === '' || vc === '') {
      toastr.options.target = '#loginModalPanel';
      toastr.error("Must enter both access and verify codes");
      return;
    }

    // Now use the special login message 
    // (which invokes the appropriate RPCs at the back-end)

    var message = {
      type: 'login',
      params: {
        ac: ac,
        vc: vc
      }
    };
    EWD.send(message, function(responseObj) {
      if (!responseObj.message.error) {
        $('#loginPanel').hide();
        $('#welcomePanel').text(responseObj.message.greeting);
        toastr.success(responseObj.message.greeting);
        // successfully logged in
        // at this point we'd probably load a new fragment that sets up the application ready for use
      }
    });
  });

  $('#loginPanel').on('show.bs.modal', function() {
    setTimeout(function() {
      document.getElementById('username').focus();
    },1000);
  });

  $('#loginPanelBody').keydown(function(event) {
    if (event.keyCode === 13) {
      document.getElementById('loginBtn').click();
    }
  });

  $('#loginPanel').modal({
	backdrop: 'static',
	keyboard: true
  });


  // now we can fetch the welcome message
  var message = {
    type: 'RPC',
    params: {
      rpcName: 'XUS INTRO MSG'
    }
  };
  EWD.send(message, function(responseObj) {
    var arr = [];
    for (var i in responseObj.message.value) {
      arr.push(responseObj.message.value[i]);
    }
    $('#loginIntro').html("<pre>" + arr.join('\n') + "</pre>");
    // make the login button visible so the user can start interacting
    //  now it's safe to do so

    $('#loginBtn').show();
  });

}

$(document).ready(function() {
  EWD.on('ewd-registered', function() {
    EWD.log = true;
    var params = {
      name: 'login.html',
      targetId: 'loginPanel'
    };
    EWD.getFragment(params, login);

  });

  EWD.on('error', function(responseObj) {
    // automatically display all returned errors using toastr
    var error = responseObj.message.error || responseObj.message;
    toastr.error(error);
  });

  EWD.start('vista', $, io);
});


