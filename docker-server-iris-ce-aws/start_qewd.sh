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

# QEWD-Up Startup for Container derived from IRIS Community Edition

# Force password change

if [ -e /opt/qewd/mapped/password.txt ]
then
  echo "Changing password"
  cp /opt/qewd/mapped/password.txt /opt/qewd/mapped/password_cpy.txt
  cd /usr/irissys/dev/Cloud/ICM
  chmod +x changePassword.sh
  ./changePassword.sh /opt/qewd/mapped/password_cpy.txt
  echo "Password changed"
fi

cd /opt/qewd
echo "start IRIS"

iris start iris

echo "iris started; now start QEWD"

cp /usr/irissys/bin/iris800.node /opt/qewd/node_modules/iris.node

#cp /opt/qewd/mapped/master.js /opt/qewd/node_modules/qewd/lib/master.js
#cp /opt/qewd/mapped/start.js /opt/qewd/node_modules/ewd-qoper8/lib/master/proto/start.js

npm start

# NOTE: Callin Service must be manually enabled using System Management Portal
#  before QEWD will work
