# qewd-server

# Dockerised version of QEWD

# M/Gateway Developments Ltd
# 2 January 2019

#FROM node:boron
#FROM node:carbon
FROM node:10-stretch

RUN apt-get update && apt-get install -y \
  build-essential \
  libssl-dev \
  dos2unix \
  wget \
  gzip \
  openssh-server \
  curl \
  python-minimal \
  libelf1 \
  locate \
  nano 

# Create app directory
RUN mkdir -p /opt/qewd
WORKDIR /opt/qewd

COPY install_yottadb.sh /opt/qewd
COPY gde.txt /opt/qewd
RUN chmod +x /opt/qewd/install_yottadb.sh

RUN cd /opt/qewd

# Install app dependencies
COPY package.json /opt/qewd
RUN npm install
RUN npm install module-exists

# Install YottaDB & NodeM

RUN ["/opt/qewd/install_yottadb.sh"]

# Bundle app source
COPY . /opt/qewd

RUN chmod +x /opt/qewd/ydb

RUN mkdir /opt/qewd/www
RUN mkdir /opt/qewd/www/qewd-monitor

RUN cp /opt/qewd/node_modules/qewd-monitor/www/bundle.js /opt/qewd/www/qewd-monitor
RUN cp /opt/qewd/node_modules/qewd-monitor/www/*.html /opt/qewd/www/qewd-monitor
RUN cp /opt/qewd/node_modules/qewd-monitor/www/*.css /opt/qewd/www/qewd-monitor

RUN cp /opt/qewd/node_modules/ewd-client/lib/proto/ewd-client.js /opt/qewd/www

RUN cd /opt/qewd

EXPOSE 8080

# ENTRYPOINT ["/bin/bash", "-l"]

CMD [ "npm", "start" ]
