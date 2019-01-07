# Contents

- [The QEWD-Up Configuration File](#the-qewd-up-configuration-file)
- [Using QEWD-Up Configuration Default Settings](#using-qewd-up-configuration-default-settings)
- [Over-riding QEWD Startup Default Values](#over-riding-qewd-startup-default-values)
  - [Native Monolith](#native-monolith)
  - [Docker Monolith](#docker-monolith)
  - [Docker MicroServices](#docker-microservices)
  - [QEWD Startup Properties](#qewd-startup-properties)
- [Specifying Your MicroService Instances](#specifying-your-microservice-instances)

# The QEWD-Up Configuration File

The overall physical configuration of a QEWD-Up system is defined in the */configuration/config.json* file.

The *config.json* file **MUST** contain only a single object, specified using valid JSON syntax (eg property names must be double quoted, as must string values).

Amongst other things, the *config.json* file tells QEWD:

- to use the QEWD-Up extension/abstraction;
- the startup configuration of each QEWD instance in your system, eg:
  - the type of Global Storage database that will be integrated as persistent JavaScript Object storage
  - the maximum number of QEWD Worker processes that each QEWD instance can use
- the physical locations of any QEWD MicroService instances, in terms of their IP addresses/domain names and listening TCP/IP ports.

# Using QEWD-Up Configuration Default Settings

QEWD-Up will use sensible default values for any unspecified properties, so your *config.json* file can usually be fairly simple, and just specify any deviations you want from the defaults.

Indeed, in the case of a Native Monolithic application, you can run QEWD-Up without any *config.json* file at all, in which case QEWD-Up will use all of its default settings.

In the case of Docker Monolith or Docker MicroService QEWD-Up systems, as a minimum you must have a *config.json* file that contains:

      {
        "qewd_up": true
      }


QEWD-Up will apply the following defaults:

- YottaDB (currently v1.22) will be assumed to be the available Global Storage database;
- QEWD will listen on port 8080 (which should be mapped to an external port if using the Docker version)
- the maximum Worker pool size will be 2
- the name of the QEWD instance (as displayed by the *qewd-monitor* application will be *QEWD Server*
- the *QEWD Management Password* (as used by the *qewd-monitor* application will be *keepThisSecret!*
- QEWD will automatically add CORS response headers
- QEWD will use Express as its externally-facing web server, along with the standard Express *body-parser* which will be configured for JSON request processing


# Over-riding QEWD Startup Default Values

The means by which you override QEWD startup settings depends on the QEWD-Up Mode you are using.

## Native Monolith

Your *config.json* file should include the *qewd* sub-object, within which you define your QEWD startup over-ride values.  For example:


      {
        "qewd": {
          "port": 3000,
          "poolSize": 4
        }
      }


The Native QEWD instance will listen on port 3000 and will use a maximum of 4 Worker processes.  QEWD-Up will apply its defaults to all other settings.


## Docker Monolith

Your *config.json* file should include the *qewd* sub-object, within which you define your QEWD startup over-ride values.  For example:


      {
        "qewd-up": true,
        "qewd": {
          "poolSize": 4
        }
      }


The Dockerised QEWD instance will use a maximum of 4 Worker processes.  QEWD-Up will apply its defaults to all other settings.


## Docker MicroServices

The overall *config.json* structure allows you to define the configuration settings for the *orchestrator* instance and for each of your MicroService instances:

      {
        "qewd-up": true,
        "orchestrator": {
          // Orchestrator configuration settings
        },
        microservices: [
          {
            // configuration of first MicroService instance
          },
          // ..etc
        ]
      }


You can specify any QEWD configuration over-ride values for the *Orchestrator* instance and/or any of the MicroService instances by using the *qewd* sub-object, within which you define your QEWD startup over-ride values.  For example:


      {
        "qewd-up": true,
        "orchestrator": {
          "qewd": {
            "serverName": "Orchestrator"
            "poolSize": 4
          }
        },
        microservices: [
          {
            "qewd": {
              "serverName": "MicroService 1"
              "poolSize": 6
            }
          }
        ]
      }


The Dockerised QEWD instance will use a maximum of 4 Worker processes.  QEWD-Up will apply its defaults to all other settings.


## QEWD Startup Properties

There are many QEWD startup configuration settings available, but many are of little if any use within a QEWD-Up environment, and it is recommended that you apply as few overrides as possible, unless you really understand the inner-workings of QEWD.

If you're interested, you'll see how the full range of startup configuration settings [is defined and applied in this QEWD module which starts the Master process](https://github.com/robtweed/qewd/blob/master/lib/master.js#L92).

Of the available properties, it is recommended you limit your overrides to the following ones:

- **managementPassword**: specifies the *QEWD Management Password* which is primarily used for logging into the *qewd-monitor* application.  Default: *keepThisSecret!*
- **serverName**: controls the QEWD instance name that is displayed in the *qewd-monitor Overview* screen.  Default: *QEWD Server*
- **port**: the TCP/IP port on which the QEWD instance will listen.  Default: *8080*. This property is really only applicable to the Native Monolith mode.  When using the Docker modes, you will map the QEWD listener port to an external one anyway, so you might as well use the default value for the port on which QEWD listens within the QEWD Docker Container
- **poolSize**: the maximum number of Worker processes that QEWD will startup and run concurrently.  Default: *2*
- *database**: defines the Global Storage database that will be integrated with the QEWD instance to provide persistent JSON storage.  This is done using one or two sub-properties:

  - **type**: the Global Storage database type.  Default: *gtm* (which, for historical reasons, is the type that is used to specify [YottaDB](https://yottadb.com/)).  Other possible values include:

    - *cache*: InterSystems Cache or Ensemble
    - *iris*: InterSystems IRIS Data Platform
    - *redis*: [Redis-based Global Storage emulation](https://github.com/robtweed/ewd-redis-globals)

  - **params**: If you have specified a *type* of *redis*, *cache* or *iris*, you will need to provide the connection parameters in this sub-object.  For *redis*, you may need to specify the *host* IP address and *port* (if you're running Redis on a separate server and/or using a non-default listener port).  For *cache* and *iris*, you'll need to specify the manager directory *path*, *namespace*, *username* and *password*.  [See this example](https://github.com/robtweed/qewd/blob/master/up/examples/cache/microservices/configuration/config.json).

- **bodyParser**: use this to specify an alternative Body Parser module from the standard Express one.  Alternatively, if you want to custom-configure the standard Body Parser module, you should specify set this property with a value of *body-paser*.  [See here for more details](https://github.com/robtweed/qewd/blob/master/up/docs/Life_Cycle_Events.md#addmiddleware)


# Specifying Your MicroService Instances

This section is only relevant if you're using QEWD-Up's Docker MicroService mode.

You don't need to do anything further to configure your Orchestrator - when you start up the Orchestrator Docker Container, it will be listening on the port you mapped in your *docker run* command for incoming REST requests.

However, the Orchestrator needs to know how to make its connections to your MicroService instances.  This is done using the *microservices* array within your *config.json* file.  You define each MicroService using an object with 3 properties as follows:

- **name**: The name of your MicroService.  It's up to you what you call it.  The name should start with an alphabetic character and otherwise contain alphanumeric characters and/or _ (underscore) or - (hyphen) characters.
- **host**: The IP address or domain name of the system hosting the Docker container
- **port**: The port on which the MicroService Docker container is listening


Optionally, as described above, you can define any QEWD startup default configuration over-rides via the *qewd* sub-object within the MicroService configuration object.

For example:

      {
        "qewd-up": true,
        "orchestrator": {
          "qewd": {
            "serverName": "QEWD Orchestrator"
          }
        }
        "microservices": [
          {
            "name": "login_service",
            "host": "http://192.168.1.78",
            "port": 8081,
            "qewd": {
              "serverName": "Login MicroService"
            }
          },
          {
            "name": "info_service",
            "host": "http://192.168.1.78",
            "port": 8082,
            "qewd": {
              "serverName": "Info MicroService"
            }
          }
        ]
      }

In this example, the Orchestrator will connect to two MicroService QEWD Docker Containers that listen on port 8081 and 8082 respectively, both hosted on the server at IP address *192.168.1.78*.

The MicroService names are then referenced within your [*routes.json*](https://github.com/robtweed/qewd/blob/master/up/docs/Routes.md) file.



