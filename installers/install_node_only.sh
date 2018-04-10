#!/usr/bin/env bash

if [ -f "/usr/bin/node" ]; then

  echo "Node.js appears to have already been installed - aborting"

else

  VERSION=${1:-8}

  echo 'Preparing environment'

  sudo apt-get update
  sudo apt-get install -y curl

  # Node.js

  echo 'Installing Node.js'

  cd ~

  curl -o- https://raw.githubusercontent.com/creationix/nvm/v0.32.1/install.sh | bash
  export NVM_DIR="$HOME/.nvm"
  [ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh" # This loads nvm
  nvm install $VERSION

  PLATFORM=$(uname -m)

  if [[ "$PLATFORM" == "armv"* ]]; then
    # Raspberry Pi - don't set up sudo linkages
    echo "Installing on a Raspbery Pi"
  else

    #make Node.js available to sudo

    echo "Setting up sudo access to Node.js"

    sudo ln -s /usr/local/bin/node /usr/bin/node
    sudo ln -s /usr/local/lib/node /usr/lib/node
    sudo ln -s /usr/local/bin/npm /usr/bin/npm
    sudo ln -s /usr/local/bin/node-waf /usr/bin/node-waf
    n=$(which node);n=${n%/bin/node}; chmod -R 755 $n/bin/*; sudo cp -r $n/{bin,lib,share} /usr/local
  fi

  echo 'Node.js has been installed.  Check by typing: node -v'

fi
