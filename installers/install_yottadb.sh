#!/usr/bin/env bash

# run using: source install_gtm.sh

# Acknowledgement: Wladimir Mutel for NodeM configuration logic
#                  KS Bhaskar for YottaDB installation logic

# run as normal user, eg ubuntu

if [ -d "/usr/lib/yottadb" ]; then
  echo "YottaDB appears to have already been installed - aborting"
  return
fi

# Prepare

echo 'Preparing environment'

sudo apt-get update
sudo apt-get install -y build-essential libssl-dev dos2unix
sudo apt-get install -y wget gzip openssh-server curl python-minimal libelf1

# YottaDB

echo 'Installing YottaDB'

mkdir /tmp/tmp # Create a temporary directory for the installer
cd /tmp/tmp    # and change to it. Next command is to download the YottaDB installer
wget https://raw.githubusercontent.com/YottaDB/YottaDB/master/sr_unix/ydbinstall.sh -O gtminstall
chmod +x gtminstall # Make the file executable

gtmroot=/usr/lib/yottadb
gtmcurrent=$gtmroot/current
if [ -e "$gtmcurrent"] ; then
  mv -v $gtmcurrent $gtmroot/previous_`date -u +%Y-%m-%d:%H:%M:%S`
fi
sudo mkdir -p $gtmcurrent # make sure directory exists for links to current YottaDB
sudo -E ./gtminstall --utf8 default --verbose --linkenv $gtmcurrent --linkexec $gtmcurrent
echo 'Configuring YottaDB'

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

# Node.js

echo 'Installing Node.js'

cd ~

curl -o- https://raw.githubusercontent.com/creationix/nvm/v0.32.1/install.sh | bash
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh" # This loads nvm

VERSION=${1:-8}

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

# QEWD

echo 'Installing QEWD and associated modules'

cd ~
mkdir qewd
cd qewd
npm install qewd qewd-monitor

# NodeM

echo 'Installing NodeM'

npm install nodem
sudo ln -sf $gtm_dist/libgtmshr.so /usr/local/lib/
sudo ldconfig
base=~/qewd
[ -f "$GTMCI" ] || export GTMCI="$(find $base -iname nodem.ci)"
export ydb_ci="$(find $base -iname nodem.ci)"
nodemgtmr="$(find $base -iname v4wnode.m | tail -n1 | xargs dirname)"
echo "$gtmroutines" | fgrep "$nodemgtmr" || export gtmroutines="$nodemgtmr $gtmroutines"
echo "$ydb_routines" | fgrep "$nodemgtmr" || export ydb_routines="$nodemgtmr $ydb_routines"

echo 'base=~/qewd' >> ~/.profile
echo '[ -f "$GTMCI" ] || export GTMCI="$(find $base -iname nodem.ci)"' >> ~/.profile
echo 'export ydb_ci="$(find $base -iname nodem.ci)"' >> ~/.profile
echo 'nodemgtmr="$(find $base -iname v4wnode.m | tail -n1 | xargs dirname)"' >> ~/.profile
echo 'echo "$gtmroutines" | fgrep "$nodemgtmr" || export gtmroutines="$nodemgtmr $gtmroutines"' >> ~/.profile
echo 'echo "$ydb_routines" | fgrep "$nodemgtmr" || export ydb_routines="$nodemgtmr $ydb_routines"' >> ~/.profile

# QEWD configuration

dos2unix ~/qewd/node_modules/qewd/installers/*

echo 'Moving QEWD files into place'

mv ~/qewd/node_modules/qewd/example/qewd-gtm.js ~/qewd/qewd.js

cd ~/qewd
mkdir www
cd www
mkdir qewd-monitor
cp ~/qewd/node_modules/qewd-monitor/www/bundle.js ~/qewd/www/qewd-monitor
cp ~/qewd/node_modules/qewd-monitor/www/*.html ~/qewd/www/qewd-monitor
cp ~/qewd/node_modules/qewd-monitor/www/*.css ~/qewd/www/qewd-monitor

cd ~/qewd

echo 'Done!'
echo 'You should now be able to start QEWD by typing: node qewd'
