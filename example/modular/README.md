This is an example of a QEWD application, built using a modular construction pattern.

If you use VistA, it will demonstrate logging in, using a re-usable vista-login component.

Copy the /www files to an application directory, eg ~/qewd/www/vista

Copy /service-modules/vista-login directory to ~/qewd/node_modules/vista-login

Copy /back-end-module/vista.js to ~/qewd/node_modules/vista.js

You'll need to also install browserify:

      cd ~/qewd
      npm install babelify
      npm install -g browserify

For the application, you need to install bootstrap v3 and toastr:

      cd ~/qewd
      npm install bootstrap@3
      npm install toastr

also install

      npmn install ewd-client

Provided you've alredy installed the ewd-xpress-monitor application, you'll have the other modules 
such as jQuery already installed.

To create the bundle.js file needed by the app:

     cd ~/qewd/www/vista
     browserify -t [ babelify ] app.js -o bundle.js

Restart QEWD

Load the app in a browser using http://xx.xx.xx.xx:8080/vista/index.html
(substitute the IP address and port as required)
