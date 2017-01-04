#!/usr/bin/env bash

# Install GlobalsDB, Node.js and QEWD on Ubuntu System

# Update first just to be sure

sudo apt-get update
sudo apt-get install -y build-essential libssl-dev
sudo apt-get install -y wget gzip openssh-server curl

# Install GlobalsDB

# First increase shared memory quotas

sudo sysctl -w kernel.shmall=536870912
sudo sysctl -w kernel.shmmax=536870912
sudo /bin/su -c "echo 'kernel.shmall=536870912' >> /etc/sysctl.conf"
sudo /bin/su -c "echo 'kernel.shmmax=536870912' >> /etc/sysctl.conf"

cd ~
wget https://s3-eu-west-1.amazonaws.com/globalsdb/globals_2013.2.0.350.0_unix.tar.gz

gzip -cd globals_2013.2.0.350.0_unix.tar.gz | tar -x
rm globals_2013.2.0.350.0_unix.tar.gz
cd kit_unix_globals
mkdir ~/globalsdb
ISC_QUIET=yes
export ISC_QUIET
ISC_TGTDIR=~/globalsdb
export ISC_TGTDIR
ISC_PLATFORM=lnxsusex64
export ISC_PLATFORM
./installGlobals

cd ~
rm -rf kit_unix_globals

# Install NVM

curl -o- https://raw.githubusercontent.com/creationix/nvm/v0.32.1/install.sh | bash
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh" # This loads nvm
nvm install 6

# Now ready to install qewd

cd ~
mkdir qewd
cd qewd
npm install qewd qewd-monitor
npm install ewd-client

# Load the latest cache.node interface module and move it into the correct place

cd ~/qewd/node_modules
wget https://s3-eu-west-1.amazonaws.com/cache.node/build-124/linux/cache610.node
mv cache610.node cache.node

# Finally move various files into place:

cp ~/qewd/node_modules/qewd/example/qewd-globalsdb.js ~/qewd/qewd.js


cd ~/qewd
mkdir www
cd www
mkdir qewd-monitor
cp ~/qewd/node_modules/qewd-monitor/www/bundle.js ~/qewd/www/qewd-monitor
cp ~/qewd/node_modules/qewd-monitor/www/*.html ~/qewd/www/qewd-monitor
cp ~/qewd/node_modules/qewd-monitor/www/*.css ~/qewd/www/qewd-monitor
cp ~/qewd/node_modules/ewd-client/lib/proto/ewd-client.js ~/qewd/www/ewd-client.js

cd ~/qewd

echo 'Done!'
echo 'Start qewd using: node qewd'



 