FROM intersystems/iris:2018.2.0.575.0-community

RUN apt-get update && apt-get install -y \
  wget \
  curl \
  locate \
  nano 

# Create app directory
RUN mkdir -p /opt/qewd
WORKDIR /opt/qewd

COPY ./install_node_only.sh /opt/qewd
RUN chmod +x /opt/qewd/install_node_only.sh
RUN ["/opt/qewd/install_node_only.sh"]

RUN cd /opt/qewd
COPY ./package.json /opt/qewd
RUN npm install

# Bundle app source
COPY . /opt/qewd

RUN mkdir /opt/qewd/www
RUN mkdir /opt/qewd/www/qewd-monitor

RUN cp /opt/qewd/node_modules/qewd-monitor/www/bundle.js /opt/qewd/www/qewd-monitor
RUN cp /opt/qewd/node_modules/qewd-monitor/www/*.html /opt/qewd/www/qewd-monitor
RUN cp /opt/qewd/node_modules/qewd-monitor/www/*.css /opt/qewd/www/qewd-monitor

RUN cp /opt/qewd/node_modules/ewd-client/lib/proto/ewd-client.js /opt/qewd/www

RUN cd /opt/qewd
RUN chmod +x /opt/qewd/start_qewd.sh

EXPOSE 8080
