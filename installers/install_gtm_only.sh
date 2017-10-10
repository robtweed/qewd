#!/usr/bin/env bash

# run using: source install_gtm.sh

# Acknowledgement: Wladimir Mutel for NodeM configuration logic
#                  KS Bhaskar for GT.M installation logic

# run as normal user, eg ubuntu

if [ -d "/usr/lib/fis-gtm" ]; then

  echo "GT.M appears to have already been installed - aborting"

else


  # Prepare

  echo 'Preparing environment'

  sudo apt-get update
  sudo apt-get install -y build-essential libssl-dev
  sudo apt-get install -y wget gzip openssh-server curl python-minimal

  # GT.M

  echo 'Installing GT.M'

  mkdir /tmp/tmp # Create a temporary directory for the installer
  cd /tmp/tmp    # and change to it. Next command is to download the GT.M installer
  wget https://sourceforge.net/projects/fis-gtm/files/GT.M%20Installer/v0.13/gtminstall
  chmod +x gtminstall # Make the file executable

  # Thanks to KS Bhaskar for the following enhancement:

  ##sudo -E ./gtminstall --utf8 default --verbose # download and install GT.M including UTF-8 mode

  gtmroot=/usr/lib/fis-gtm
  gtmcurrent=$gtmroot/current
  if [ -e "$gtmcurrent"] ; then
    mv -v $gtmcurrent $gtmroot/previous_`date -u +%Y-%m-%d:%H:%M:%S`
  fi
  sudo mkdir -p $gtmcurrent # make sure directory exists for links to current GT.M
  sudo -E ./gtminstall --utf8 default --verbose --linkenv $gtmcurrent --linkexec $gtmcurrent # download and   install GT.M including UTF-8 mode

  echo 'Configuring GT.M'

  # source "/usr/lib/fis-gtm/V6.3-000_x86_64"/gtmprofile
  # echo 'source "/usr/lib/fis-gtm/V6.3-000_x86_64"/gtmprofile' >> ~/.profile

  gtmprof=$gtmcurrent/gtmprofile
  gtmprofcmd="source $gtmprof"
  $gtmprofcmd
  tmpfile=`mktemp`
  if [ `grep -v "$gtmprofcmd" ~/.profile | grep $gtmroot >$tmpfile`] ; then
    echo "Warning: existing commands referencing $gtmroot in ~/.profile may interfere with setting up environment"
    cat $tmpfile
  fi

  # ****** Temporary fix to ensure that invocation of gtmprofile is added correctly to .profile

  # if [ `grep -v "$gtmprofcmd" ~/.profile` ] ; then 
  #   echo "$gtmprofcmd" >> ~/.profile 
  # fi

  echo 'copying ' $gtmprofcmd ' to profile...'
  echo $gtmprofcmd >> ~/.profile

  # ****** end of temporary fix

  rm $tmpfile
  unset tmpfile gtmprofcmd gtmprof gtmcurrent gtmroot

  echo 'GT.M has been installed and configured, ready for use'
  echo 'Enter the GT.M shell by typing the command: gtm  Exit it by typing the command H'

  # --- End of KS Bhaskar enhancement

  cd ~

fi
