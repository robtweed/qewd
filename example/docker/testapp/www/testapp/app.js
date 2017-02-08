$(document).ready(function() {

   EWD.log = true;

  EWD.on('ewd-registered', function() {
    $('#testBtn').on('click', function(e) {
      var message = {type: 'testButton'};
      EWD.send(message, function(messageObj) {
        $('#content').text(messageObj.message.ok);
      });

    });
  });

  EWD.start('testapp', $, io);
});
