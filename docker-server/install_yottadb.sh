#!/usr/bin/env bash

# 25 September 2018

# YottaDB

echo 'Installing YottaDB'

mkdir /tmp/tmp # Create a temporary directory for the installer
cd /tmp/tmp    # and change to it. Next command is to download the YottaDB installer
wget https://raw.githubusercontent.com/YottaDB/YottaDB/master/sr_unix/ydbinstall.sh -O gtminstall
chmod +x gtminstall # Make the file executable

gtmroot=/usr/lib/yottadb
gtmcurrent=$gtmroot/current

mkdir -p $gtmcurrent # make sure directory exists for links to current YottaDB
./gtminstall --utf8 default --verbose --linkenv $gtmcurrent --linkexec $gtmcurrent
echo 'Configuring YottaDB'

gtmprof=$gtmcurrent/gtmprofile
gtmprofcmd="source $gtmprof"
$gtmprofcmd
tmpfile=`mktemp`

echo 'copying ' $gtmprofcmd ' to profile...'
echo $gtmprofcmd >> ~/.profile

rm $tmpfile
unset tmpfile gtmprofcmd gtmprof gtmcurrent gtmroot

cd /opt/qewd
mkdir sessiondb

echo 'step 1...'
/usr/local/lib/yottadb/r122/mumps -run ^GDE < /opt/qewd/gde.txt
echo 'step 2...'
/usr/local/lib/yottadb/r122/mupip create -region=qewdreg
echo 'step 3...'
/usr/local/lib/yottadb/r122/mupip set -nojournal -region qewdreg

echo 'YottaDB has been installed and configured, ready for use'

cd /opt/qewd

# NodeM

echo 'Installing NodeM'

# Install the trial version with SimpleAPI support

npm install nodem@pre-release

ln -sf $gtm_dist/libgtmshr.so /usr/local/lib/
ldconfig
#base=~/qewd
base=/opt/qewd
[ -f "$GTMCI" ] || export GTMCI="$(find $base -iname nodem.ci)"
export ydb_ci="$(find $base -iname nodem.ci)"
nodemgtmr="$(find $base -iname v4wnode.m | tail -n1 | xargs dirname)"
echo "$gtmroutines" | fgrep "$nodemgtmr" || export gtmroutines="$nodemgtmr $gtmroutines"

#echo 'base=~/qewd' >> ~/.profile
echo 'base=/opt/qewd' >> ~/.profile
echo '[ -f "$GTMCI" ] || export GTMCI="$(find $base -iname nodem.ci)"' >> ~/.profile
echo 'export ydb_ci="$(find $base -iname nodem.ci)"' >> ~/.profile
echo 'nodemgtmr="$(find $base -iname v4wnode.m | tail -n1 | xargs dirname)"' >> ~/.profile
echo 'echo "$gtmroutines" | fgrep "$nodemgtmr" || export gtmroutines="$nodemgtmr $gtmroutines"' >> ~/.profile



