#!/usr/bin/env bash

# run using: source install_yottadb_only.sh

# Acknowledgement: KS Bhaskar for YottaDB installation logic

# run as normal user, eg ubuntu

  gtmroot=/usr/lib/yottadb
  gtmcurrent=$gtmroot/current

  echo 'Configuring YottaDB'

  gtmprof=$gtmcurrent/gtmprofile
  gtmprofcmd="sh $gtmprof"
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

