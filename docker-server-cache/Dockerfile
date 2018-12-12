# qewd-server-cache

# Dockerised version of QEWD

# M/Gateway Developments Ltd
# 12 December 2018

FROM node:8-stretch

RUN apt-get update && apt-get install -y \
  build-essential \
  libssl-dev \
  net-tools \
  dos2unix \
  wget \
  gzip \
  openssh-server \
  curl \
  locate \
  nano

# Create app directory
RUN mkdir -p /opt/qewd
WORKDIR /opt/qewd

COPY package.json /opt/qewd
RUN npm install
RUN npm install module-exists

RUN mkdir -p /tmp/cachekit
RUN cd /opt/qewd

COPY . /opt/qewd

RUN mv /opt/qewd/cache800.node /opt/qewd/node_modules/cache.node

RUN gunzip -c cache*.tar.gz | ( cd /tmp/cachekit ; tar xf - )
WORKDIR /tmp/cachekit/cache-2018.1.0.184.0su-lnxsusex64

ENV ISC_PACKAGE_INSTANCENAME="CACHE" \
    ISC_PACKAGE_INSTALLDIR="/opt/cachesys" \
    ISC_PACKAGE_UNICODE="Y" \
    ISC_PACKAGE_PLATFORM="lnxsusex64" \
    ISC_PACKAGE_STARTCACHE="N"

RUN sed '18i   platforms="lnxsusex64"' package/install > package/install.new
RUN mv package/install.new package/install
RUN chmod +x package/install

RUN ./cinstall_silent

RUN chown cacheusr:cacheusr /opt/cachesys/mgr/*
RUN rm /opt/qewd/cache*.tar.gz
RUN rm /opt/qewd/Dockerfile

EXPOSE 57772 1972
RUN cd /opt/qewd
WORKDIR /opt/qewd

# Bundle app source

RUN mkdir /opt/qewd/www
RUN mkdir /opt/qewd/www/qewd-monitor
RUN cp /opt/qewd/node_modules/qewd-monitor/www/bundle.js /opt/qewd/www/qewd-monitor
RUN cp /opt/qewd/node_modules/qewd-monitor/www/*.html /opt/qewd/www/qewd-monitor
RUN cp /opt/qewd/node_modules/qewd-monitor/www/*.css /opt/qewd/www/qewd-monitor
RUN cp /opt/qewd/node_modules/ewd-client/lib/proto/ewd-client.js /opt/qewd/www

RUN cd /opt/qewd

EXPOSE 8080

#ENTRYPOINT ["/bin/bash", "-l"]

WORKDIR /opt/qewd

RUN chmod +x /opt/qewd/startup.sh
CMD ["/opt/qewd/startup.sh"]


