#!/usr/bin/env bash

# 19 November 2018

# Prepare

echo 'Preparing environment'

sudo apt-get update
sudo apt-get install -y build-essential libssl-dev dos2unix nano locate
sudo apt-get install -y wget gzip openssh-server curl python-minimal libelf1

# YottaDB

echo 'Installing YottaDB'

ydbver="r122"

# Create a temporary directory for the installer
mkdir -p /tmp/tmp
cd /tmp/tmp
wget https://gitlab.com/YottaDB/DB/YDB/raw/master/sr_unix/ydbinstall.sh
chmod +x ydbinstall.sh

gtmroot=/usr/lib/yottadb
gtmcurrent=$gtmroot/current

# make sure directory exists for links to current YottaDB
sudo mkdir -p $gtmcurrent
sudo ./ydbinstall.sh --utf8 default --verbose --linkenv $gtmcurrent --linkexec $gtmcurrent --force-install
echo 'Configuring YottaDB'

gtmprof=$gtmcurrent/gtmprofile
gtmprofcmd="source $gtmprof"
$gtmprofcmd
tmpfile=`mktemp`

echo 'copying ' $gtmprofcmd ' to profile...'
echo $gtmprofcmd >> ~/.profile

rm $tmpfile
unset tmpfile gtmprofcmd gtmprof gtmcurrent gtmroot

mkdir ~/.yottadb/sessiondb

cat >~/.yottadb/sessiondb/gde.txt <<EOL
add -name CacheTempEWDSession -region=qewdreg
add -region qewdreg -dynamic=qewdseg
add -segment qewdseg -file=$HOME/.yottadb/sessiondb/qewd.dat
exit
EOL

echo 'Setting up local internal, unjournalled region for QEWD Session global'
/usr/local/lib/yottadb/$ydbver/mumps -run ^GDE < $HOME/.yottadb/sessiondb/gde.txt
/usr/local/lib/yottadb/$ydbver/mupip create -region=qewdreg
/usr/local/lib/yottadb/$ydbver/mupip set -file -nojournal $HOME/.yottadb/sessiondb/qewd.dat

echo 'YottaDB has been installed and configured, ready for use'

# Node.js

echo 'Installing Node.js'

cd ~

curl -o- https://raw.githubusercontent.com/creationix/nvm/v0.33.11/install.sh | bash
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh" # This loads nvm

VERSION=${1:-10}

nvm install $VERSION

PLATFORM=$(uname -m)
if [[ "$PLATFORM" != "armv"* ]]; then

  #make Node.js available to sudo

  sudo ln -s /usr/local/bin/node /usr/bin/node
  sudo ln -s /usr/local/lib/node /usr/lib/node
  sudo ln -s /usr/local/bin/npm /usr/bin/npm
  sudo ln -s /usr/local/bin/node-waf /usr/bin/node-waf
  n=$(which node);n=${n%/bin/node}; chmod -R 755 $n/bin/*; sudo cp -r $n/{bin,lib,share} /usr/local
fi


