#!/usr/bin/env bash

#  ----------------------------------------------------------------------------
# | qewd-server: Start-up file for Dockerised version of QEWD                |
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

#  24 January 2019

# Install Node.js Using NVM


if [ -f "/usr/bin/node" ]; then

  echo "Node.js appears to have already been installed - aborting"

else

  VERSION=${1:-8}

  # Node.js

  echo 'Installing Node.js'

  cd ~

  curl -o- https://raw.githubusercontent.com/creationix/nvm/v0.32.1/install.sh | bash
  export NVM_DIR="$HOME/.nvm"
  [ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh" # This loads nvm
  nvm install $VERSION


  #make Node.js available to sudo

  echo "Setting up sudo access to Node.js"

  ln -s /usr/local/bin/node /usr/bin/node
  ln -s /usr/local/lib/node /usr/lib/node
  ln -s /usr/local/bin/npm /usr/bin/npm
  ln -s /usr/local/bin/node-waf /usr/bin/node-waf
  n=$(which node);n=${n%/bin/node}; chmod -R 755 $n/bin/*; cp -r $n/{bin,lib,share} /usr/local

  echo 'Node.js has been installed.  Check by typing: node -v'

fi
