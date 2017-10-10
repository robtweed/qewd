#!/usr/bin/env bash

sudo apt-get update
sudo apt-get install -y build-essential wget redis-tools

echo "-----------------------------------------------------------------------"
echo " Installing Redis..."
echo "-----------------------------------------------------------------------"

cd ~
wget http://download.redis.io/redis-stable.tar.gz
tar xvzf redis-stable.tar.gz

# rename the created redis directory to just redis

mv redis-stable redis
cd redis

# build Redis

echo "Building Redis - be patient, this will take a few minutes"

make
sudo make install
cd utils

PORT=6379
CONFIG_FILE=/etc/redis/6379.conf
LOG_FILE=/var/log/redis_6379.log
DATA_DIR=/var/lib/redis/6379
EXECUTABLE=/usr/local/bin/redis-server

echo -e "${PORT}\n${CONFIG_FILE}\n${LOG_FILE}\n${DATA_DIR}\n${EXECUTABLE}\n" | sudo ./install_server.sh
sudo update-rc.d redis_6379 defaults

echo "Redis is now installed and running, listening on port 6379"



