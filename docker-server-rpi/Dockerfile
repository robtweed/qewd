# qewd-server

# Dockerised version of QEWD for Raspberry Pi

# M/Gateway Developments Ltd
# 24 October 2020

#FROM hypriot/rpi-node:boron
#FROM hypriot/rpi-node:8
#FROM node:10-stretch
#FROM node:12.18.2-stretch
FROM node:14.14.0-stretch

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
  nano \
  subversion \
  xinetd \
  git

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
RUN npm install module-exists piscina qewd-jsdb-piscina
# no longer needed as picked up by qewd-jsdb-piscina:
# RUN npm install mg-dbx
  
# Install YottaDB & NodeM

RUN ["/opt/qewd/install_yottadb.sh"]

# Bundle app source
COPY . /opt/qewd

RUN sed -i 's/128/130/g' /opt/qewd/ydb
RUN sed -i 's/1.28/1.30/g' /opt/qewd/ydb
RUN sed -i 's/V6.3-007/V6.3-008/g' /opt/qewd/ydb

RUN chmod +x /opt/qewd/ydb
RUN chmod +x /opt/qewd/backup
RUN chmod +x /opt/qewd/update_to_r130

RUN mkdir /opt/qewd/www
RUN mkdir /opt/qewd/www/qewd-monitor

RUN git clone https://github.com/robtweed/qewd-client
RUN cp /opt/qewd/qewd-client/qewd-client.js /opt/qewd/www
RUN rm -r /opt/qewd/qewd-client

RUN git clone https://github.com/robtweed/mg-webComponents
RUN cp /opt/qewd/mg-webComponents/mg-webComponents.js /opt/qewd/www
#RUN rm -r /opt/qewd/mg-webComponents

RUN mkdir /opt/qewd/www/components
RUN mkdir /opt/qewd/www/components/adminui
RUN git clone https://github.com/robtweed/wc-admin-ui /opt/qewd/www/components/adminui

RUN mkdir /opt/qewd/www/components/leaflet
RUN git clone https://github.com/robtweed/wc-leaflet /opt/qewd/www/components/leaflet

RUN mkdir /opt/qewd/www/components/d3
RUN git clone https://github.com/robtweed/wc-d3 /opt/qewd/www/components/d3

RUN mkdir /opt/qewd/www/qewd-monitor-adminui
RUN git clone https://github.com/robtweed/qewd-monitor-adminui /opt/qewd/www/qewd-monitor-adminui

RUN cp /opt/qewd/node_modules/qewd-monitor/www/bundle.js /opt/qewd/www/qewd-monitor
RUN cp /opt/qewd/node_modules/qewd-monitor/www/*.html /opt/qewd/www/qewd-monitor
RUN cp /opt/qewd/node_modules/qewd-monitor/www/*.css /opt/qewd/www/qewd-monitor

RUN cp /opt/qewd/node_modules/ewd-client/lib/proto/ewd-client.js /opt/qewd/www

RUN cd /opt/qewd

EXPOSE 8080

#ENTRYPOINT ["/bin/bash", "-l"]

CMD [ "npm", "start" ]
