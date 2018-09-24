#!/usr/bin/env bash

# Set up a QEWD / React.js development environment

# 24 September 2018

cd ~/qewd

npm install react react-dom babelify react-bootstrap react-toastr react-select socket.io-client
npm install @babel/core @babel/preset-react @babel/preset-env
npm install jquery ewd-client ewd-react-tools ewd-xpress-react qewd-react create-react-class

npm install -g browserify
npm install -g uglify-js

# Now you can compile an application bundle:
#  cp ~/qewd/node_modules/qewd-monitor/www/*.js ~/qewd/www/qewd-monitor
#  cd ~/qewd/www/qewd-monitor
#  or
#  cd ~/qewd/node_modules/qewd-monitor/www

#  browserify -o bundle.js -t [ babelify --presets [ @babel/preset-env @babel/preset-react ] --plugins [ @babel/plugin-transform-classes ] ] app.js 

#  cp ~/qewd/node_modules/qewd-monitor/www/bundle.js ~/qewd/www/qewd-monitor
