#!/usr/bin/env bash

# run using: source install_yottadb_only.sh

# Acknowledgement: KS Bhaskar for YottaDB installation logic

# run as normal user, eg ubuntu

if [ -d "/usr/lib/yottadb" ]; then

  echo "YottaDB appears to have already been installed - aborting"

else

  # Prepare

  echo 'Preparing environment'

  sudo apt-get update
  sudo apt-get install -y build-essential libssl-dev
  sudo apt-get install -y wget gzip openssh-server curl python-minimal libelf1

  if [[ "$PLATFORM" == "armv"* ]]; then
    sudo ln -s /lib/arm-linux-gnueabihf/libncursesw.so.6 /lib/arm-linux-gnueabihf/libncurses.so.5
  fi

# YottaDB

ydbversion=r1.28

echo "Installing YottaDB $ydbversion"

mkdir /tmp/tmp # Create a temporary directory for the installer
cd /tmp/tmp    # and change to it. Next command is to download the YottaDB installer
wget https://gitlab.com/YottaDB/DB/YDB/raw/master/sr_unix/ydbinstall.sh
chmod +x ydbinstall.sh # Make the file executable


gtmroot=/usr/lib/yottadb
gtmcurrent=$gtmroot/current
if [ -e "$gtmcurrent"] ; then
  mv -v $gtmcurrent $gtmroot/previous_`date -u +%Y-%m-%d:%H:%M:%S`
fi
sudo mkdir -p $gtmcurrent # make sure directory exists for links to current YottaDB
sudo ./ydbinstall.sh --utf8 default --verbose --linkenv $gtmcurrent --linkexec $gtmcurrent $ydbversion
echo "Configuring YottaDB $ydbversion"

gtmprof=$gtmcurrent/gtmprofile
gtmprofcmd="source $gtmprof"
$gtmprofcmd
tmpfile=`mktemp`
if [ `grep -v "$gtmprofcmd" ~/.profile | grep $gtmroot >$tmpfile`] ; then
  echo "Warning: existing commands referencing $gtmroot in ~/.profile may interfere with setting up environment"
  cat $tmpfile
fi

echo 'copying ' $gtmprofcmd ' to profile...'
echo $gtmprofcmd >> ~/.profile

rm $tmpfile
unset tmpfile gtmprofcmd gtmprof gtmcurrent gtmroot

echo 'YottaDB has been installed and configured, ready for use'
echo 'Enter the YottaDB shell by typing the command: gtm  Exit it by typing the command H'

  cd ~

fi
