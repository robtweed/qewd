#!/usr/bin/env bash

# Set up a QEWD / React.js development environment

cd ~/qewd

npm install react react-dom babelify babel-preset-react react-bootstrap react-toastr react-select socket.io-client
npm install jquery ewd-client ewd-react-tools qewd-react

npm install -g browserify
npm install -g uglify-js

cd ~/qewd/www/qewd-monitor
npm install babel-preset-es2015

# Now you can compile an application bundle:
#  cp ~/qewd/node_modules/qewd-monitor/www/*.js ~/qewd/www/qewd-monitor
#  cd ~/qewd/www/qewd-monitor
#  or
#  cd ~/qewd/node_modules/qewd-monitor/www
#  browserify -t [ babelify --compact false --presets [es2015 react] ] app.js | uglifyjs > bundle.js
#  cp ~/qewd/node_modules/qewd-monitor/www/bundle.js ~/qewd/www/qewd-monitor
