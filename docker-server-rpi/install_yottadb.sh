#!/usr/bin/env bash

# 15 June 2020

# YottaDB

ydbversion="r1.28"
ydbver="r128"
platform="_armv7l"

echo "Installing YottaDB $ydbversion"


# Create a temporary directory for the installer
mkdir -p /tmp/tmp
cd /tmp/tmp
wget https://gitlab.com/YottaDB/DB/YDB/raw/master/sr_unix/ydbinstall.sh
chmod +x ydbinstall.sh

gtmroot=/usr/lib/yottadb
gtmcurrent=$gtmroot/current

# make sure directory exists for links to current YottaDB
mkdir -p $gtmcurrent
./ydbinstall.sh --utf8 default --verbose --linkenv $gtmcurrent --linkexec $gtmcurrent --force-install $ydbversion
echo "Configuring YottaDB $ydbversion"

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

echo 'Setting up local internal, unjournalled region for QEWD Session global'
/usr/local/lib/yottadb/$ydbver/mumps -run ^GDE < /opt/qewd/gde.txt
/usr/local/lib/yottadb/$ydbver/mupip create -region=qewdreg
/usr/local/lib/yottadb/$ydbver/mupip set -file -nojournal /opt/qewd/sessiondb/qewd.dat
/usr/local/lib/yottadb/$ydbver/mupip set -key_size=1019 -region qewdreg

# Install and configure mgsql routines and QEWD's interface to them

svn export https://github.com/chrisemunt/mgsql/trunk/yottadb /opt/qewd/mgsql
cp /opt/qewd/mgsql/* /root/.yottadb/$ydbversion$platform/r
/usr/local/lib/yottadb/$ydbver/mumps -run ylink^%mgsql
rm -r /opt/qewd/mgsql

echo 'mgsql has been installed'
echo ' '

# Install and configure the M interface routines for mg-dbx

svn export https://github.com/chrisemunt/mg-dbx/trunk/yottadb /opt/qewd/mgsi
cp /opt/qewd/mgsi/* /root/.yottadb/$ydbversion$platform/r
/usr/local/lib/yottadb/$ydbver/mumps -run ylink^%zmgsi
rm -r /opt/qewd/mgsi

cp /opt/qewd/node_modules/qewd-mg-dbx/ci/qewd.ci /usr/local/lib/yottadb/$ydbver
cp /opt/qewd/node_modules/qewd-mg-dbx/ci/qewdInterface.m /root/.yottadb/$ydbversion$platform/r

echo 'zmgsi has been installed'
echo ' '

# Set up optional xinetd network interface for mg-dbx

cp /opt/qewd/node_modules/qewd-mg-dbx/xinetd/zmgsi_ydb /usr/local/lib/yottadb/$ydbver
cp /opt/qewd/node_modules/qewd-mg-dbx/xinetd/zmgsi_xinetd /etc/xinetd.d/zmgsi_xinetd

echo "zmgsi_xinetd          7041/tcp                        # zmgsi" >> /etc/services

echo 'Optional xinetd interface for mg-dbx has been installed'
echo ' '

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
