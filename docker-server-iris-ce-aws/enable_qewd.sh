#!/usr/bin/env bash

#  ----------------------------------------------------------------------------
# | qewd: Script for enabling QEWD on IRIS Community Edition                 |
# |                                                                          |
# | Copyright (c) 2017-19 M/Gateway Developments Ltd,                        |
# | Redhill, Surrey UK.                                                      |
# | All rights reserved.                                                     |
# |                                                                          |
# | http://www.mgateway.com                                                  |
# | Email: rtweed@mgateway.com                                               |
# |                                                                          |
# |                                                                          |
# | Licensed under the Apache License, Version 2.0 (the "License");          |
# | you may not use this file except in compliance with the License.         |
# | You may obtain a copy of the License at                                  |
# |                                                                          |
# |     http://www.apache.org/licenses/LICENSE-2.0                           |
# |                                                                          |
# | Unless required by applicable law or agreed to in writing, software      |
# | distributed under the License is distributed on an "AS IS" BASIS,        |
# | WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. |
# | See the License for the specific language governing permissions and      |
# |  limitations under the License.                                          |
# ----------------------------------------------------------------------------

#  28 November 2019

# Install Node.js Using NVM

apt-get update
apt-get install -y build-essential python-minimal curl subversion


if [ -f "/usr/bin/node" ]; then

  echo "Node.js appears to have already been installed - aborting"

else

  VERSION=${1:-12}

  # Node.js

  echo 'Installing Node.js'

  cd ~

  curl -o- https://raw.githubusercontent.com/creationix/nvm/v0.32.1/install.sh | bash
  export NVM_DIR="$HOME/.nvm"
  [ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh" # This loads nvm
  nvm install $VERSION

  echo 'Node.js has been installed.  Check by typing: node -v'

  ln -s /usr/irissys/bin /ISC/dur/bin

  # Now install the mgsql routines

  svn export https://github.com/chrisemunt/mgsql/trunk/m /ISC/qewd-install/m

  export LD_LIBRARY_PATH="/usr/irissys/bin"

  cd /ISC/qewd-install
  npm install
  node install_mgsql

fi
