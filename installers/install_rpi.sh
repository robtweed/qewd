#!/usr/bin/env bash

cd ~

sudo apt-get update
sudo apt-get install -y build-essential libssl-dev
sudo apt-get install -y wget gzip curl

# Install NVM

curl -o- https://raw.githubusercontent.com/creationix/nvm/v0.32.1/install.sh | bash

export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh" # This loads nvm

command -v nvm

# Use it to install Node v 6.x

echo "NVM installed.  Now installing Node.js version 6.x"

nvm install 6

echo "Node.js installed:"
node -v

# Now install QEWD

cd ~
mkdir qewd
cd ~/qewd

npm install qewd qewd-monitor

# now install ewd-redis-globals

npm install tcp-netx
npm install ewd-redis-globals

# QEWD

echo 'Moving QEWD files into place'

mv ~/qewd/node_modules/qewd/example/qewd-rpi.js ~/qewd/qewd.js

cd ~/qewd
mkdir www
cd www
mkdir qewd-monitor
cp ~/qewd/node_modules/qewd-monitor/www/bundle.js ~/qewd/www/qewd-monitor
cp ~/qewd/node_modules/qewd-monitor/www/*.html ~/qewd/www/qewd-monitor
cp ~/qewd/node_modules/qewd-monitor/www/*.css ~/qewd/www/qewd-monitor

echo "Node.js and QEWD installed"

# Next, install Redis

echo "Now installing Redis.."

cd ~

wget http://download.redis.io/redis-stable.tar.gz
tar xvzf redis-stable.tar.gz

# rename the created redis directory to just redis

mv redis-stable redis
cd redis

# build Redis

echo "Building Redis - be patient, this will take some time!"

make
sudo make install
cd utils
sudo ./install_server.sh

echo "Redis is now installed and running, listening on port 6379"

cd ~/qewd

echo 'Done!'
echo 'You should now be able to start QEWD by typing: node qewd'
