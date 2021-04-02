# qewd-server

# Dockerised version of QEWD

# M/Gateway Developments Ltd
# 10 December 2020

FROM ubuntu:20.04

ARG DEBIAN_FRONTEND=noninteractive

# === Install Linux packages needed by YottaDB and QEWD
#      and also for convenient user environment when
#      shelling into Container

RUN apt-get update && apt-get install -y \
  build-essential \
  libssl-dev \
  dos2unix \
  wget \
  gzip \
  openssh-server \
  curl \
  libelf1 \
  locate \
  nano \
  subversion \
  xinetd \
  git \
  libtinfo5

# ===  Install Node.js & NPM

ENV NODE_VERSION 14.15.1

RUN groupadd --gid 1000 node \
  && useradd --uid 1000 --gid node --shell /bin/bash --create-home node

RUN ARCH= && dpkgArch="$(dpkg --print-architecture)" \
  && case "${dpkgArch##*-}" in \
    amd64) ARCH='x64';; \
    ppc64el) ARCH='ppc64le';; \
    s390x) ARCH='s390x';; \
    arm64) ARCH='arm64';; \
    armhf) ARCH='armv7l';; \
    i386) ARCH='x86';; \
    *) echo "unsupported architecture"; exit 1 ;; \
  esac \
  # gpg keys listed at https://github.com/nodejs/node#release-keys
  && set -ex \
  && for key in \
    4ED778F539E3634C779C87C6D7062848A1AB005C \
    94AE36675C464D64BAFA68DD7434390BDBE9B9C5 \
    1C050899334244A8AF75E53792EF661D867B9DFA \
    71DCFD284A79C3B38668286BC97EC7A07EDE3FC1 \
    8FCCA13FEF1D0C2E91008E09770F7A9A5AE15600 \
    C4F0DFFF4E8C1A8236409D08E73BC641CC11F4C8 \
    C82FA3AE1CBEDC6BE46B9360C43CEC45C17AB93C \
    DD8F2338BAE7501E3DD5AC78C273792F7D83545D \
    A48C2BEE680E841632CD4E44F07496B3EB3C1762 \
    108F52B48DB57BB0CC439B2997B01419BD92F80A \
    B9E2F5981AA6E0CD28160D9FF13993A75599653C \
  ; do \
    gpg --batch --keyserver hkp://p80.pool.sks-keyservers.net:80 --recv-keys "$key" || \
    gpg --batch --keyserver hkp://ipv4.pool.sks-keyservers.net --recv-keys "$key" || \
    gpg --batch --keyserver hkp://pgp.mit.edu:80 --recv-keys "$key" ; \
  done \
  && curl -fsSLO --compressed "https://nodejs.org/dist/v$NODE_VERSION/node-v$NODE_VERSION-linux-$ARCH.tar.xz" \
  && curl -fsSLO --compressed "https://nodejs.org/dist/v$NODE_VERSION/SHASUMS256.txt.asc" \
  && gpg --batch --decrypt --output SHASUMS256.txt SHASUMS256.txt.asc \
  && grep " node-v$NODE_VERSION-linux-$ARCH.tar.xz\$" SHASUMS256.txt | sha256sum -c - \
  && tar -xJf "node-v$NODE_VERSION-linux-$ARCH.tar.xz" -C /usr/local --strip-components=1 --no-same-owner \
  && rm "node-v$NODE_VERSION-linux-$ARCH.tar.xz" SHASUMS256.txt.asc SHASUMS256.txt \
  && ln -s /usr/local/bin/node /usr/local/bin/nodejs \
  # smoke tests
  && node --version \
  && npm --version

ENV YARN_VERSION 1.22.5

RUN set -ex \
  && for key in \
    6A010C5166006599AA17F08146C2130DFD2497F5 \
  ; do \
    gpg --batch --keyserver hkp://p80.pool.sks-keyservers.net:80 --recv-keys "$key" || \
    gpg --batch --keyserver hkp://ipv4.pool.sks-keyservers.net --recv-keys "$key" || \
    gpg --batch --keyserver hkp://pgp.mit.edu:80 --recv-keys "$key" ; \
  done \
  && curl -fsSLO --compressed "https://yarnpkg.com/downloads/$YARN_VERSION/yarn-v$YARN_VERSION.tar.gz" \
  && curl -fsSLO --compressed "https://yarnpkg.com/downloads/$YARN_VERSION/yarn-v$YARN_VERSION.tar.gz.asc" \
  && gpg --batch --verify yarn-v$YARN_VERSION.tar.gz.asc yarn-v$YARN_VERSION.tar.gz \
  && mkdir -p /opt \
  && tar -xzf yarn-v$YARN_VERSION.tar.gz -C /opt/ \
  && ln -s /opt/yarn-v$YARN_VERSION/bin/yarn /usr/local/bin/yarn \
  && ln -s /opt/yarn-v$YARN_VERSION/bin/yarnpkg /usr/local/bin/yarnpkg \
  && rm yarn-v$YARN_VERSION.tar.gz.asc yarn-v$YARN_VERSION.tar.gz \
  # smoke test
  && yarn --version


# ====  Now set up QEWD Directories and copy in install files

RUN mkdir -p /opt/qewd
WORKDIR /opt/qewd

COPY install_yottadb.sh /opt/qewd
COPY gde.txt /opt/qewd
RUN chmod +x /opt/qewd/install_yottadb.sh

RUN cd /opt/qewd

# ==== Install QEWD & its dependencies

COPY package.json /opt/qewd
RUN echo "Installing QEWD + dependent Modules "
RUN npm install

# ===== Install YottaDB

RUN ["/opt/qewd/install_yottadb.sh"]


# =====  Bundle app source
COPY . /opt/qewd

# =====  Create QEWD Run-time environment

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

# ENTRYPOINT ["/bin/bash", "-l"]

CMD [ "npm", "start" ]
