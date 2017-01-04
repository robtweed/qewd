#!/usr/bin/env bash

# Installs a pre-built simple HTML / JavaScript ewd-xpress application

# Install the client-side JavaScript file (ewd-client.js)

cd ~/qewd
npm install ewd-client
cp ~/qewd/node_modules/ewd-client/lib/proto/ewd-client.js ~/qewd/www

# Install the simple example application

cd ~/qewd/www
mkdir test-app

cp ~/qewd/node_modules/qewd/example/test-app/index.html ~/qewd/www/test-app
cp ~/qewd/node_modules/qewd/example/test-app/node_modules/test-app.js ~/qewd/node_modules

cd ~
echo 'Done!'
