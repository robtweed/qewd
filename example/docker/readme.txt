Source is in ~/docker

Build:
cd ~/docker
sudo docker build -t rtweed/qewd .

Then:

sudo docker run -d --name redis -p 6379:6379 redis
create local directory ~/qewd/mapped

sudo docker run -d -p 8080:8080 --link redis:redis -v /home/robtweed/qewd/mapped:/opt/qewd/mapped rtweed/qewd


Raspberry Pi:

sudo docker run -d --name redis -p 6379:6379 hypriot/rpi-redis
sudo docker run -d -p 8080:8080 --link redis:redis -v /home/robtweed/qewd/mapped:/opt/qewd/mapped rtweed/rpi-qewd
