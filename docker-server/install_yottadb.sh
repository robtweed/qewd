#!/usr/bin/env bash

# 20 June 2018

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

/usr/local/lib/yottadb/r122/mumps -run ^GDE < /opt/qewd/gde.txt
/usr/local/lib/yottadb/r122/mupip create
/usr/local/lib/yottadb/r122/mupip set -file -nojournal /opt/qewd/sessiondb/qewd.dat

echo 'YottaDB has been installed and configured, ready for use'

cd /opt/qewd

# NodeM

echo 'Installing NodeM'

npm install nodem

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



