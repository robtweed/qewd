#!/usr/bin/env bash

# 28 January 2020

ydbver="r128"
ydbversion=r1.28

# Prepare

echo 'Preparing environment'

sudo apt-get update
sudo apt-get install -y build-essential libssl-dev dos2unix nano locate subversion
sudo apt-get install -y wget gzip openssh-server curl python-minimal libelf1

FILE=/etc/apt/sources.list.d/ydb.list
if [ -f "$FILE" ]; then
    echo "$FILE exist"
else 
    echo "$FILE does not exist"
    sudo touch /etc/apt/sources.list.d/ydb.list
    echo 'deb http://ftp.debian.org/debian/ buster main' | sudo tee -a /etc/apt/sources.list.d/ydb.list
    sudo apt-get update
fi

sudo apt-get -t buster install -y libc6 libncurses6

# Raspberry Pi fix

sudo ln -s /lib/arm-linux-gnueabihf/libncursesw.so.6 /lib/arm-linux-gnueabihf/libncurses.so.5

# YottaDB

echo 'Installing YottaDB'

echo "Installing YottaDB $ydbversion"

# Create a temporary directory for the installer
mkdir -p /tmp/tmp
cd /tmp/tmp
wget https://gitlab.com/YottaDB/DB/YDB/raw/master/sr_unix/ydbinstall.sh
chmod +x ydbinstall.sh

gtmroot=/usr/lib/yottadb
gtmcurrent=$gtmroot/current

# make sure directory exists for links to current YottaDB
sudo mkdir -p $gtmcurrent
sudo ./ydbinstall.sh --utf8 default --verbose --linkenv $gtmcurrent --linkexec $gtmcurrent --force-install $ydbversion
echo "Configuring YottaDB $ydbversion"

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
add -name qs -region=qewdreg
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

curl -o- https://raw.githubusercontent.com/creationix/nvm/v0.35.2/install.sh | bash
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh" # This loads nvm

VERSION=${1:-12}

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


