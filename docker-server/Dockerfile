# qewd-server

# Dockerised version of QEWD

# M/Gateway Developments Ltd
# 22 June 2020

#FROM node:boron
#FROM node:carbon
#FROM node:10-stretch
FROM node:12.18.1-stretch

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

RUN echo 'deb http://ftp.debian.org/debian/ buster main' >> /etc/apt/sources.list
RUN apt-get update
RUN apt-get -t buster install -y libc6 libncurses6

# Create app directory
RUN mkdir -p /opt/qewd
WORKDIR /opt/qewd

COPY install_yottadb.sh /opt/qewd
COPY gde.txt /opt/qewd
RUN chmod +x /opt/qewd/install_yottadb.sh

RUN cd /opt/qewd

# Install app dependencies
COPY package.json /opt/qewd
# RUN npm install -g npm@latest
RUN npm install
RUN npm install module-exists piscina qewd-jsdb-piscina

# Install YottaDB & NodeM

RUN ["/opt/qewd/install_yottadb.sh"]

# Bundle app source
COPY . /opt/qewd

RUN chmod +x /opt/qewd/ydb
RUN chmod +x /opt/qewd/backup
RUN chmod +x /opt/qewd/update_to_r128

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

# ENTRYPOINT ["/bin/bash", "-l"]

CMD [ "npm", "start" ]
