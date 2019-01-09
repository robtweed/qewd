# Contents

- [Notes on MicroService Networking](#notes-on-microservice-networking)
- [Networking Options](#networking-options)
- [Co-hosted QEWD MicroServices](#co-hosted-qewd-microServices)
  - [Setting up Docker Networking](#setting-up-docker-networking)
  - [Setting up the Orchestrator](#setting-up-the-orchestrator)
  - [Setting up a MicroService Instance](#setting-up-a-microservice-instance)
- [Separately-hosted QEWD MicroServices](#separately-hosted-qewd-microServices)
  - [Setting up a Separately-Hosted Orchestrator](#setting-up-a-separately-hosted-orchestrator)
  - [Setting up a Separately-Hosted MicroService](#setting-up-a-separately-hosted-microservice)
- [Confirming that the MicroServices are Communicating](#confirming-that-the-microservices-are-communicating)
  - [Stopping and Starting the QEWD-Up Instances](#stopping-and-starting-the-qewd-up-instances)
- [Persisting Data in the Integrated YottaDB Database](#persisting-data-in-the-integrated-yottadb-database)
   - [Installing the Pre-Initialised YottaDB Database Files](#installing-the-pre-initialised-yottadb-database-files)
  - [Mapping the YottaDB Files at Startup](#mapping-the-yottadb-files-at-startup)
- [Monitoring the QEWD Activity of your QEWD Docker Instances](#monitoring-the-qewd-activity-of-your-qewd-docker-instances)
- [Using the qewd-monitor Application](#using-the-qewd-monitor-application)


# Notes on MicroService Networking

QEWD-Up's MicroService mode makes use of multiple Docker containers, each one being an instance of QEWD.

All incoming REST requests are received by the QEWD instance that is designated to be the *Orchestrator*.  Its role is to forward most, if not all, of the incoming requests to the other QEWD instances that act as MicroServices.

In order for this to be possible, you need to understand:

- how to tell the *Orchestrator* where to find the MicroService instances, so that it can make and maintain its WebSocket connections to them

- how to make the *Orchestrator* accessible to your external REST clients

- optionally, how to make the MicroServices externally accessible to allow monitoring via the *qewd-monitor* application.

These notes aim to address these issues

# Networking Options

It is up to you where each QEWD Docker instance is physically hosted: they can all run on the same host machine or they can be distributed across multiple host machines.

The simplest scenario is where the *Orchestrator* and all the MicroService instances are co-hosted on the same physical Docker host, and it is recommended that this scenario is used for your initial experiments with QEWD-Up until you become familiar with its operation.

In advanced production environments, you'll also probably want to front-end your QEWD-Up architecture with a reverse proxy and/or load-balancer.  *NGINX* is an ideal solution for this.  If scaling becomes an issue, *NGINX* can also be used to front-end multiple instances of each MicroService.

# Co-hosted QEWD MicroServices

## Setting up Docker Networking

The simplest, most secure and least problematic way to get a Co-hosted set of QEWD-Up MicroServices to inter-operate is to make use of Docker's networking.  To do this, assuming you already have Docker installed, configured and working, you should run the following command to create our own new bridged Docker network that will be used exclusively by your QEWD-Up *Orchestrator* and MicroServices.  You should only need to invoke this command once:

      docker network create qewd-net

Note: you can name the network anything you like, but the examples that follow in this document assume you've used the name *qewd-net* as above.

You can check that the command has worked and that the *qewd-net* network is present by using:

      docker network ls

You should see something like this, showing the *qewd-net* network exists and is a bridged network:

      NETWORK ID          NAME                DRIVER              SCOPE
      759c78b28079        bridge              bridge              local
      48a2b67122aa        host                host                local
      36856a4ed61b        none                null                local
      525eb2f9b7bc        qewd-net            bridge              local


## Setting up the Orchestrator

The key aspects in setting up the *Orchestrator* QEWD-Up service are handled by the *docker run* command that you use to start it up.  These are:

- its Docker name, by which it can be referred for system management and monitoring purposes
- whether you want the Docker instance to run:
  - as a foreground process in a terminal window, which is useful when getting started with QEWD-Up and when debugging
  - as a background *daemon* process (which can still be logged using the *docker logs* command)
- the Docker network that it should use
- the host TCP port on which it is accessed
- the volume mapping, by which the QEWD-Up configuration, routing and handler definitions are made accessible to the *Orchestrator's* Docker environment
- optionally, the volume mapping that allows YottaDB (the integrated JSON storage database) to persist its data even if the *Orchestrator* Docker instance is stopped and restarted.

The command to start/restart the Orchestrator is as follows:

      docker run
        -it | -d    (foreground v daemon)
        --name {Docker instance name}
        --rm  (recommended, to remove the instance from cache when shut down)
        --net {Docker network name}
        -p {external port}:8080   (by default, QEWD-Up configures to listen on port 8080)
        -v {QEWD-Up Configuration Directory}:/opt/qewd/mapped
        -v {YottaDB persistent file directory}:/root/.yottadb/r1.22_x86_64/g  (optional)

        rtweed/qewd-server | rtweed/qewd-server-rpi  (Linux v Raspberry Pi QEWD Docker library)

For example:

      docker run -it --name orchestrator --rm --net qewd-net -p 3000:8080 -v ~/ms-db:/opt/qewd/mapped rtweed/qewd-server

This will start the *Orchestrator* service:

- as a foreground process
- with a Docker process name of *orchestrator* by which it can be referred and monitored via other Docker commands
- such that, when stopped, it is removed from Docker's cache
- using the network that we created and named *qewd-net* (see previous section)
- with QEWD's Web Server (and therefore its REST interface) accessible via port 3000 on the Docker host machine
- using the QEWD-Up configuration file folder at *~/ms-db* on the Docker host machine
- using the Linux version of the Dockerised QEWD library

Note that, depending on how you've configured Docker on the host machine, you may need to prefix the *docker run* command with *sudo*, eg:

      sudo docker run -it --name orchestrator --rm -p 3000:8080 -v ~/ms-db:/opt/qewd/mapped rtweed/qewd-server


If the host machine on which you invoked this *docker run* command had an IP address of *204.50.20.2*, then your REST Client would send its requests to:

      {api method} http://204.50.20.2:3000/{api path}

eg:

      GET http://204.50.20.2:3000/api/info


## Setting up a MicroService Instance

There are three parts to setting up a QEWD-Up MicroService instance:

- the information needed by the *Orchestrator* to discover and connect to the MicroService
- optionally, how to access the MicroService externally, if you want to be able, for example, to monitor it using the integrated *qewd-monitor* browser-based application
- the *docker run* options needed to start it up

By using our own Docker network (*qewd-net* in our case), we can just use the Docker name that we specify when starting up the MicroService, and let Docker's *automatic discovery service* pull everything else together for us.

For example, if we have a MicroService that is responsible for user login/authentication, we might decide to name it *login_service*.  All we need to do is ensure that we use this name consistently within the *config.json* file and the *docker run* command when starting it up.

So, in the */configuration/config.json* file, we would specify it as follows:

      {
        "qewd_up": true,
        "orchestrator": {
          "qewd": {
            "serverName": "Orchestrator"
          }
        },
        "microservices": [
          {
            "name": "login_service",
            "qewd": {
              "serverName": "Login MicroService"
            }
          }
        ]
      }

This provides all the information the *Orchestrator* will need to discover and connect to the *login_service* MicroService, **provided** we use our *qewd-net* Docker bridged network.

The *docker run* command used to start/restart a QEWD-Up MicroService is very similar to that used to start the Orchestrator, but **MUST** include the additional *-e* parameter:

      docker run
        -it | -d    (foreground v daemon)
        --name {MicroService name}
        --rm  (recommended, to remove the instance from cache when shut down)
        --net {Docker network name}
        -p {external port}:8080   (optional.  By default, QEWD-Up configures to listen on port 8080)
        -e microservice="{MicroService Name}"
        -v {QEWD-Up Configuration Directory}:/opt/qewd/mapped
        -v {YottaDB persistent file directory}:/root/.yottadb/r1.22_x86_64/g (optional)

        rtweed/qewd-server | rtweed/qewd-server-rpi  (Linux v Raspberry Pi QEWD Docker library)

So, to start up our *login_service* MicroService, we could invoke the command:

      docker run -it --name login_service --rm --net qewd-net -v ~/ms-db:/opt/qewd/mapped -e microservice="login_service" rtweed/qewd-server


**IMPORTANT**: You **MUST** specify both the *--name** and *-e* parameters, and they both **MUST** have the same value which **MUST** match the MicroService name in the *config.json* file.

If you want to be able to monitor the *login_service* MicroService QEWD instance using its *qewd-monitor* application, you must make it accessible via a host TCP port.  You do this by adding the *-p* parameter, eg:

      docker run -it --name login_service --rm --net qewd-net -p 3001:8080 -v ~/ms-db:/opt/qewd/mapped -e microservice="login_service" rtweed/qewd-server

This would make it accessible via the host's port 3001.

# Separately-hosted QEWD MicroServices

In order to distribute the load imposed by your individual MicroServices, you may decide to host them on separate physical servers (or Virtual Machines).

In this scenario, we can't use within-host Docker networking, and must use alternative mechanisms.  One basic mechanism is to use the hosts' own networking and ensure that each MicroService Web Server listener port is mapped to a TCP port on its host machine.  We can then use the explicit *host* and *port* properties within your *config.json* file.

## Setting up a Separately-Hosted Orchestrator

Let's suppose we want to run the *Orchestrator* on a host whose IP address is *204.50.20.2* and our QEWD-Up application is defined within the folder *~/ms-db*.

We might start it up using:

      docker run -it --name orchestrator --rm -p 3000:8080 -v ~/ms-db:/opt/qewd/mapped rtweed/qewd-server

Note that in this scenario, we don't need to use a separately-defined Docker network, because this is the only Docker instance that we'll run on this host.

Now let's suppose that we'll be running a MicroService named *login_service* on another physical host machine whose IP address is *204.50.20.3*, to which the *Orchestrator* needs to connect.

We could set this up in the *config.json* file (ie *~/ms-db/configuration/config.json*) on the *Orchestrator* host as follows:

      {
        "qewd_up": true,
        "orchestrator": {
          "qewd": {
            "serverName": "Orchestrator"
          }
        },
        "microservices": [
          {
            "name": "login_service",
            "host": "204.50.20.3",
            "port": 3000,
            "qewd": {
              "serverName": "Login MicroService"
            }
          }
        ],
        "jwt": {
          "secret": "mySharedJWTSecretString"
        }
      }

**Note**: We've added a *jwt.secret* property to the file.  This is used to sign and authenticate the JWTs that are used by QEWD's MicroServices.

In a co-hosted scenario this explicit definition of the JWT Secret is unnecessary, because a random Uid-formatted value is automatically added by the first QEWD-Up instance you start, and is then shared by all the other QEWD-Up instances when you start them.

However, if the MicroServices are running on separate physical hosts, then the JWT Secret sharing must be done by you.

The value of the JWT Secret can be any string value, but it is recommended that you use a value that cannot be easily guessed.  A randomly-generated Uid-formatted value is recommended.

In the example *config.json* file above, the *Orchestrator* will therefore expect to find and connect to the *login_service* MicroService via a host IP address of *204.50.20.3* and TCP port of 3000.


## Setting up a Separately-Hosted MicroService

Continuing with the example above, we want to now set up a MicroService named *login_service* on a host machine whose IP address is *204.50.20.3* and which the Orchestrator can connect to via the host's TCP port 3000.

The first step is to copy the folder and its contents from *~/ms-db* on the *Orchestrator* to a folder on our MicroService host machine.  For convenience, we'll use the same directory name: *~/ms-db*.

As shown in the previous section, the *config.json* file must already include a *jwt.secret* property.  **Leave this in place and unchanged!**

Now start up the *login_service* MicroService using:

      docker run -it --name login_service --rm -p 3000:8080 -v ~/ms-db:/opt/qewd/mapped -e microservice="login_service" rtweed/qewd-server

You should see the [connection activity and registration handshaking](#confirming-that-the-microservices-are-communicating) taking place in the terminal windows where you're running the *Orchestrator* and *login_service* Docker instances.

Your QEWD-Up services are now ready for use.  You should now be able to send REST requests to the *Orchestrator* at:

      {method} http://204.50.20.2:3000/{api-path}

eg:

      POST http://204.50.20.2:3000/api/login

This request should generate the appropriate activity on the *login_service* MicroService on its host machine at *204.50.20.3* as a result of invoking the */api/login* API handler method.


# Confirming that the MicroServices are Communicating

Something that you'll want to be able to confirm is whether or not the *Orchestrator* has been able to successfully find and connect to its MicroServices.

One basic way is to try sending a REST API request that is handled by a MicroService.  If the Orchestrator has been unable to make its connection, an error response will be returned to the REST client:

      {"error": "MicroService connection is down"}

A better way is to inspect what happened when you started each QEWD-Up instance.  The following details apply for both co-located and separately-located MicroServices.

When you first start the Orchestrator as a foreground process and look at its QEWD activity log within the terminal window, you'll see that it contains line like these:

      Starting QEWD
      Setting up micro-service connections
      Adding MicroService Client connection: url = http://login_service:8080; application = login_service
      starting microService connection to http://login_service:8080

and it should finish with the lines:

      ========================================================
      ewd-qoper8 is up and running.  Max worker pool size: 2
      ========================================================
      ========================================================
      QEWD.js is listening on port 8080
      ========================================================

At this point, the *login_service* MicroService hasn't been started, so the *Orchestrator* will not have been able to connect to it.  However, it is waiting for it to start and will automatically detect if/when it becomes available.


Now let's start the *login_service* MicroService.  If the networking and configuration details are correct, then you should see the following appear in the *Orchestrator* QEWD activity:

      login_service registered
      http://login_service:8080 micro-service ready

Simultaneously, you should see something like the following in the *login_service* MicroService's QEWD activity:

      Wed, 09 Jan 2019 13:48:28 GMT; worker 37 received message: {"type":"ewd-register","application":"login_service","jwt":true,"socketId":"CylKV170ui8jhkwRAAAA","ipAddress":"::ffff:172.18.0.2"}
      **** jwtHandler encrypt: key = 28e672080cd693aaf3ffc725713911f97494a3b265cb399d73ba07ca478c778c
      **** jwtHandler encrypt: iv = addb7057dece2deccf639973e9b96542
      Wed, 09 Jan 2019 13:48:28 GMT; master process received response from worker 37: {"type":"ewd-register","finished":true,"message":{"token":"eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJleHAiOjE1NDcwNDIwMDgsImlhdCI6MTU0NzA0MTcwOCwiaXNzIjoicWV3ZC5qd3QiLCJhcHBsaWNhdGlvbiI6ImxvZ2luX3NlcnZpY2UiLCJ0aW1lb3V0IjozMDAsInFld2QiOiI5YTRhMTI4ODllOTg4OTJmY2VmZmU4OWZhM2NkNGRjNzE2MGEwNzk1ZDUwOWNjZTM3NTllYTAyNjViZjIyYmJkOGEzNzZjZTUyMzBmZjcyYTljZGI2NmUyYzY0NmMyOTRhMDg1MmU2ZmFhNDBiMTcxZTllZDNhN2U2MzJlMDg3Y2ZjZjAyODY2YTU1OTcwMDdlNmZjZGNhZWIzZTQ1MTZlNTk2YmE1ZDllNzRlZmQwZWU5YjRiYTk1ZTU5MDUxZjEifQ.sv1ycIfuUyNa55nwxhJFO3peUrT0G2zqewnBGYgHNOQ"}} 

What has happened is that the *Orchestrator* detected the *login_service* MicroService becoming available via its configured network connection, established a WebSocket connection to it and sent a registration message to it,  In response to this, the *login_service* MicroService QEWD instance generated a JWT and returned it to the *orchestrator* as part of its registration response message.

If you **didn't** see this activity on the *Orchestrator* and your MicroService instance, it means that there's something wrong with either the networking or the network configuration information in your *config.json* file.

If you *do* see this activity, then the *Orchestrator* and *login_service* MicroService are now ready to inter-operate.

## Stopping and Starting the QEWD-Up Instances

The QEWD instances that make up your overall service can be stopped and restarted independently and in any sequence, and they will automatically re-connect and re-register with each other.

You can try this out and see it working.  First, stop the *login_service* MicroService instance whilst leaving the *Orchestrator running.  You should see the following in the *Orchestrator's* QEWD Activity log:

      *** server has disconnected socket, probably because it shut down

Now restart the *login_service* MicroService instance.  Once it has fully started and usually after a brief pause, the *Orchestrator's* QEWD Activity log should now show:

      *** socketClient re-register - secret = a0477748-bcba-413c-bd33-e0674267e3f7
      Re-registered

In the *login_service* MicroService's QEWD Activity log you'll see the same registration message/response activity as before.

Now, leaving the *login_service* MicroService running, see what happens when you stop the *Orchestrator*: you should see something like this appear in the *login_service* MicroService's QEWD Activity log:

      socket sFVXjHr6Jl6wuVpFAAAA disconnected

Now restart the *Orchestrator*.  As soon as it is fully started, you'll see the *login_service* MicroService receive a registration request from the *Orchestrator* and the *Orchestrator's* activity log will show that the MicroService is ready for use.

# Persisting Data in the Integrated YottaDB Database

By default, any data that is created within the integrated YottaDB database within a Dockerised QEWD instance is lost when you shut it down.

In order to persist such data between restarts of the QEWD instance, you must:

- install and configure a pre-initialised copy of the YottaDB database files on your host machine
- map the folder containing these YottaDB files to the internal folder where YottaDB within the Docker container expects to find these files

## Installing the Pre-Initialised YottaDB Database Files

We've already created a Github repository that contains the files you need.  Just create a directory for them on your host machine and clone the files.

For example, if we wanted to persist user authentication information that we might save within our *login_service* MicroService, we might create a directory for them on the Docker host machine using:

      mkdir -p ~/yottadb/login_service

The simplest way to clone the files we need from the Github repository is to use *subversion*.  If you haven't already installed it:

      sudo apt-get install subversion

Then clone the pre-initialised YottaDB files using:

      cd ~/yottadb
      svn export https://github.com/robtweed/yotta-gbldir-files/trunk --depth files login_service

**Note**: if you're using a Raspberry Pi, you need the compatible versions of the YottaDB files.  Change the commands above to:

      cd ~/yottadb
      svn export https://github.com/robtweed/yotta-gbldir-files/trunk/rpi/r1.22 login_service


You should now see the three files that will be used by YottaDB for persistent data storage in the *~/yottadb/login_service* directory.

It's a good idea to ensure their permissions are set to allow the appropriate read/write access:

      cd login_service
      sudo chmod 666 *

## Mapping the YottaDB Files at Startup

Now you can start the *login_service* MicroService as follows:

      docker run -it --name login_service --rm --net qewd-net -v ~/ms-db:/opt/qewd/mapped -v ~/yottadb/login_service:/root/.yottadb/r1.22_x86_64/g -e microservice="login_service" rtweed/qewd-server

YottaDB within the QEWD Docker container will now read from and write to your host-sourced copies of its database files, and as a result, YottaDB data is persisted between restarts of the *login_service* MicroService.

# Monitoring the QEWD Activity of your QEWD Docker Instances

If you start the *orchestrator* and MicroServices as foreground processes (ie using the *-it* parameter), then you'll be able to view all the QEWD activity within the terminal window.

However, if you start them as background daemon processes, then, of course, you can't see what's happening within them.

**Note**: if you lose contact with the host machine's network for some reason, Docker processes started as foreground ones will continue to run, effectively as daemon processes.

If you want to view the QEWD activity of a daemon QEWD process, you can use the *docker logs* command:

      docker logs -f {Docker name}

For example:

      docker logs -f orchestrator

or:

      docker logs -f login_service


# Using the *qewd-monitor* Application 

If you have exposed QEWD-Up's Web Server default listener port (8080) via a host port (using the -p parameter), then you can use the browser-based *qewd-monitor* application.

So, for example, if the IP address of the host machine is *204.50.20.2*, and if you had started the *Orchestrator* using:

      docker run -it --name orchestrator --rm --net qewd-net -p 3000:8080 -v ~/ms-db:/opt/qewd/mapped rtweed/qewd-server

Then you could start its *qewd-monitor* application in a browser by using the following URL:

      http://204.50.20.2:3000/qewd-monitor

Similarly, if you'd started the *login_service* MicroService using:

      docker run -it --name login_service --rm --net qewd-net -p 3001:8080 -v ~/ms-db:/opt/qewd/mapped -e microservice="login_service" rtweed/qewd-server

Then you could start its *qewd-monitor* application in a browser by using the following URL:

      http://204.50.20.2:3001/qewd-monitor

You'll need to enter the QEWD management password which has been set by default as:

      keepThisSecret!

It is recommended that you change this password. This is done within your *config.json* file by setting the *qewd.managementPassword* property for the *Orchestrator* and each MicroService.  For example:

      {
        "qewd_up": true,
        "orchestrator": {
          "qewd": {
            "serverName": "Orchestrator",
            "managementPassword": "myOrchestratorPassword"
          }
        },
        "microservices": [
          {
            "name": "login_service",
            "qewd": {
              "serverName": "Login MicroService",
              "managementPassword": "myLoginServicePassword"
            }
          }
        ]
      }

It's up to you what to specify as the password, but, as you have now made the *qewd-monitor* application publicly accessible, and because it allows the QEWD instance to be shut down and any persistent data to be viewable, you should choose a suitably cryptic password.


When you log in to the *qewd-monitor* application, the Overview panel will appear, showing configuration information and the activity in the QEWD Master and Worker processes.

Clicking the red *X* buttons next to the Master and Worker processes will stop them.  It is always quite safe to stop the Worker processes at any time - QEWD will automatically restart them as demand requires.  You'll always see at least one Worker process in the Overview panel, even if you shut them all down - because *qewd-monitor* requires access to a Worker process in order to display the information you're viewing.  Stopping the Worker processes is a quick and simple way to ensure that you're using the latest API handler methods during development (API handler methods always run in QEWD Worker processes, and Node.js caches them).

Stopping the Master process within the *qewd-monitor* application will stop the Docker instance.  This is the cleanest way to stop a QEWD instance, ensuring that the connections to YottaDB are cleanly shut down before the Docker instance stops.

Click the *Document Store* tab in the top banner and you should see two Persistent JSON Documents named *Documents* and *DocumentsIndex*.  Click on them to drill down into their structure.

