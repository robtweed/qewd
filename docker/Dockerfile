FROM node:boron

# Create app directory
RUN mkdir -p /opt/qewd
WORKDIR /opt/qewd

# Install app dependencies
COPY package.json /opt/qewd
RUN npm install

# Bundle app source
COPY . /opt/qewd


RUN mkdir /opt/qewd/www
RUN mkdir /opt/qewd/www/qewd-monitor

RUN cd /opt/qewd/node_modules/qewd-monitor/www

RUN cp /opt/qewd/node_modules/qewd-monitor/www/bundle.js /opt/qewd/www/qewd-monitor
RUN cp /opt/qewd/node_modules/qewd-monitor/www/*.html /opt/qewd/www/qewd-monitor
RUN cp /opt/qewd/node_modules/qewd-monitor/www/*.css /opt/qewd/www/qewd-monitor

RUN cp /opt/qewd/node_modules/ewd-client/lib/proto/ewd-client.js /opt/qewd/www

EXPOSE 8080
CMD [ "npm", "start" ]