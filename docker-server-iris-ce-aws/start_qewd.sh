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

if [ -e /opt/qewd/mapped/password_cpy.txt.done ]
then
  rm /opt/qewd/mapped/password_cpy.txt.done
fi

if [ -e /opt/qewd/mapped/password.txt ]
then
  echo "Changing password"
  PASSWORD=$(</opt/qewd/mapped/password.txt)
  cp /opt/qewd/mapped/password.txt /opt/qewd/mapped/password_cpy.txt
  cd /usr/irissys/dev/Cloud/ICM
  chmod +x changePassword.sh
  ./changePassword.sh /opt/qewd/mapped/password_cpy.txt
  echo "Password changed"
fi

cd /opt/qewd
echo "start IRIS"

iris start iris

printf '_SYSTEM\n%s\nzn "%%SYS"\nS props("Enabled")=1\nI ##class(Security.Services).Modify("%%Service_Callin", .props)\n' "$PASSWORD" | irissession IRIS

echo "IRIS started"

cp /usr/irissys/bin/iris800.node /opt/qewd/node_modules/iris.node

RUN_MODE=${QEWD_RUN_MODE:-'interactive'}

if [ "$RUN_MODE" == 'daemon' ]
then
  npm start
else
  echo "To start QEWD by typing: npm start"
  /bin/bash -l
fi

