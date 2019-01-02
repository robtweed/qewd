# qewd-up: A new fast-track route to Building APIs Using QEWD
 
Rob Tweed <rtweed@mgateway.com>  
11 December 2018, M/Gateway Developments Ltd [http://www.mgateway.com](http://www.mgateway.com)  

Twitter: @rtweed

Google Group for discussions, support, advice etc: [http://groups.google.co.uk/group/enterprise-web-developer-community](http://groups.google.co.uk/group/enterprise-web-developer-community)

# What is QEWD-Up?

Previously, in order to use QEWD, you needed to create a mixture of configuration settings and application code, and in doing so you needed to have a relatively detailed understanding of how QEWD worked under the covers.  This meant:

- a learning curve which took time and effort
- it could be difficult and time-consuming to construct the necessary moving parts that make up an API
- the scalability of this approach could become more problematic with increasing numbers of APIs to support
- the maintainability of APIs could be tricky and difficult to trace through the moving parts of QEWD itself.  Someone else picking up your APIs wouldn’t necessarily find it intuitively clear what they were doing and how they worked.

QEWD-Up is a new layer of abstraction on top of QEWD that aims to hide all these issues away, leaving you with just a simple description of your API routes and the associated code that they invoke at the QEWD back-end.  You now just describe the What, and QEWD-up looks after the How.  Under the covers, it’s all standard QEWD as before - it’s just all been automated and abstracted out of the way for you!

# QEWD-Up Modes

QEWD-Up can be used in three key architectural modes:

- [**Dockerised QEWD Monolith**](#dockerised-qewd-monolith): QEWD running as a Dockerised Container, and as a monolithic application defined as a set of REST APIs

- [**Dockerised QEWD MicroServices**](#dockerised-qewd-microservices): A set of Dockerised QEWD Containers, implementing your REST APIs across a set of MicroServices

- [**Native QEWD Monolith**](#native-qewd-monolith): If you prefer a native, un-Dockerised platform, this option has QEWD installed and running natively on your system (along with Node.js and YottaDB), allowing you to create a monolithic application defined as a set of REST APIs

In the first two modes, *all* you need to install on your hardware is Docker.  Everything else that is needed by QEWD is encapsulated within the QEWD Docker Container(s).  These two Docker-based modes allow you to be up and running with the minimum of fuss and and within a few minutes, rapidly building APIs that are as complex as you require, but which are easy to maintain and understand.

Getting started with each of the QEWD-Up modes is described below.  They all follow a similar pattern, but there are some mode-specific differences.


# Dockerised QEWD Monolith

## Pre-requisites 

It's very quick and simple to get started in this mode, because all you need to install on your machine is Docker.  Everything else is handled by the QEWD Docker Container (which is available from the Docker Hub as rtweed/docker-server (or, if you use a Raspberry Pi: rtweed/docker-server-rpi )

There are lots of documents on the Internet that describe how to install Docker.  If you use Ubuntu 18.04, I’ve found [this to be an excellent set of instructions](https://www.digitalocean.com/community/tutorials/how-to-install-and-use-docker-on-ubuntu-18-04).

However, if you’re using a different flavour of Linux, a simple Google search will quickly find what you need.

if you want to try out QEWD-Up on a Raspberry Pi, you can install Docker by simply typing:

      curl -sSL https://get.docker.com | sh


## Defining Your APIs

Create a folder for your application / suite of APIs.  I'm going to name my example *dockerExample* (eg using the file path *~/dockerExample*).  Also create sub-folders beneath it as shown below (use the sub-folder names exactly as shown):


        ~/dockerExample
            |
            |— configuration
            |
            |— apis
            |

Create two text files in the configuration folder:


        ~/dockerExample
            |
            |— configuration
            |            |
            |            |— routes.json
            |            |
            |            |— config.json
            |
            |— apis
            |


### The *config.json* File

The *config.json* file provides QEWD-Up with instructions on how to configure QEWD.  

As its file extension implies, its contents must be correctly-structured JSON.

QEWD-Up will apply sensible default values unless overridden by information in your *config.json* file.

At the very least, your *config.json* file should contain the following:

      {
        "qewd_up": true
      }

See later in this document for more details on the *config.json* file and how to configure QEWD differently from the QEWD-Up defaults.


### The *routes.json* File

You MUST create a file named *routes.json*.  This file contains the definitions of your REST routes, expressed as a JSON array of route objects.  Each route is described in terms of:

- the URI path
- the HTTP method
- the name of the handler module that will perform the work of this API

*eg* here’s the definition of a single API:

      [
        {
          "uri": "/api/info",
          "method": "GET",
          "handler": "getInfo"
        }
      ]

You can describe as many routes as you wish in this file.  The syntax MUST be strict JSON - ie all property names and text-string values must be double-quoted.


### Defining Your API Handlers

You define your API Handlers within the *apis* folder.  First create a sub-folder for each *handler* property name that you defined in the *routes.json* file (see above).  For example, using the *routes.json* example above, you'd create:

        ~/dockerExample
            |
            |— configuration
            |            |
            |            |— routes.json
            |            |
            |            |— config.json
            |
            |— apis
            |    |
            |    |— getInfo
            |


Within each handler sub-folder, you now create a module file that defines the code that will be invoked when the API route is requested.  This module file can be named either *handler.js* or *index.js".  For example:

        ~/dockerExample
            |
            |— configuration
            |            |
            |            |— routes.json
            |            |
            |            |— config.json
            |
            |— apis
            |    |
            |    |— getInfo
            |            |
            |            |— handler.js



Here's an example *handler.js* file for the *getInfo* API:

      module.exports = function(args, finished) {
        finished({
          info: {
            server: 'Qewd-Up Container',
            arch: process.arch,
            platform: process.platform,
            versions: process.versions,
            memory: process.memoryUsage(),
          }
        });
      };

If you’ve written QEWD REST handlers, you’ll recognise this format.  

In summary, simply export a function with 2 arguments:

- **args**: an object that contains the content of your REST request, including its path, headers, HTTP method, any querystring values and any body payload

- **finished**: the QEWD function that you use to end your handler.  This function releases the QEWD worker process that handled your module back to QEWD's available worker pool, and tells QEWD to return the object you provide as its argument as a JSON response to the REST client that sent the original request.


## Starting your QEWD Container

Fire up the QEWD Docker Container, eg:

    docker run -it --name qewdup --rm -p 8080:8080 -v ~/dockerExample:/opt/qewd/mapped rtweed/qewd-server

Note: you may need to add sudo to the start of this command, depending on how you configured your Docker environment.

If you’re using a Raspberry Pi:

    docker run -it --name qewdup --rm -p 8080:8080 -v ~/dockerExample:/opt/qewd/mapped rtweed/qewd-server-rpi

By default, QEWD listens within the Docker Container on port 8080.  The command examples above are mapping this to port 8080 on your host machine.  If you want to use a different host port, just change the -p directive, eg to listen on port 3000:

    docker run -it --name qewdup --rm -p 3000:8080 -v ~/dockerExample:/opt/qewd/mapped rtweed/qewd-server


Your application's configuration and API files are mapped into the Docker Container using this parameter:

    -v ~/dockerExample:/opt/qewd/mapped

**Always** map your QEWD-Up Application Folder to */opt/qewd/mapped*


## Running Your APIs

Now you can try out your API(s).  By default, if you specified port 8080 as your host listener port, point a browser at:

       http://192.168.1.100:8080/api/info

        (change the IP address as appropriate)

and back should come the results from your API handler module, eg:

      {
          "info": {
              "server": "Qewd-Up Container",
              "arch": "x64",
              "platform": "linux",
              "versions": {
                  "http_parser": "2.8.0",
                  "node": "10.12.0",
                  "v8": "6.8.275.32-node.35",
                  "uv": "1.23.2",
                  "zlib": "1.2.11",
                  "ares": "1.14.0",
                  "modules": "64",
                  "nghttp2": "1.34.0",
                  "napi": "3",
                  "openssl": "1.1.0i",
                  "icu": "62.1",
                  "unicode": "11.0",
                  "cldr": "33.1",
                  "tz": "2018e"
              },
              "memory": {
                  "rss": 52396032,
                  "heapTotal": 11780096,
                  "heapUsed": 7756656,
                  "external": 28323
              }
          }
      }

That’s it - your API is up and working!

You can now add more routes and their associated handler methods.  If you do, you must restart QEWD-Up.

To stop your running QEWD instance, just type CTRL & C.

To restart QEWD-Up, just re-use the *docker run* command (as shown above) again.


## Installing Additional Node.js Modules

if you need to use additional Node.js modules (ie ones not automatically included with QEWD itself), you can do this by adding the file *install_modules.json*, eg:

        ~/dockerExample
            |
            |— install_modules.json
            |
            |— configuration
            |            |
            |            |— routes.json
            |            |
            |            |— config.json
            |

This file should contain a JSON array, listing the names of the modules you want loaded from NPM.  For example:

      [
        "a-find",
        "body-parser-xml",
        "multer"
      ]

The modules in this file are loaded from NPM when the *qewd-server* Docker Container is next started.  Modules are saved into a *node_modules* folder in your mapped host file volume.  As a result, the next time(s) you start the Docker Container, your additional modules are already available and don't need to be reloaded.

So, after starting the Container, you'll see the *node_modules* folder that will have been created, eg:

        ~/dockerExample
            |
            |— install_modules.json
            |
            |— node_modules
            |            |
            |            a_find
            |            ...etc
            |
            |— configuration
            |            |
            |            |— routes.json
            |            |
            |            |— config.json


If you later modify your *install_modules.json* file and add new modules, they will be loaded from NPM into the *node_modules* folder when the Container is next restarted.

# Dockerised QEWD MicroServices

This mode allows you to split out your APIs and run them as separate, discrete MicroServices.  For example, you might want to separate out your APIs by overall business function, so, for example, all the APIs that are related to user authentication could be in one single MicroService.

Your MicroServices can run on separate physical machines, or they can all run on one host machine, or any combination between - it’s a very scalable and powerful approach.

## Pre-requisites 

It's very quick and simple to get started in this mode, because all you need to install on each machine that will host a MicroService is Docker.  Everything else is handled by each instance of the QEWD Docker Container (which is available from the Docker Hub as rtweed/docker-server (or, if you use a Raspberry Pi: rtweed/docker-server-rpi )

There are lots of documents on the Internet that describe how to install Docker.  If you use Ubuntu 18.04, I’ve found [this to be an excellent set of instructions](https://www.digitalocean.com/community/tutorials/how-to-install-and-use-docker-on-ubuntu-18-04).

However, if you’re using a different flavour of Linux, a simple Google search will quickly find what you need.

if you want to try out QEWD-Up on a Raspberry Pi, you can install Docker by simply typing:

      curl -sSL https://get.docker.com | sh


## Key Concepts

In a QEWD-Up MicroService architecture, all external-facing communication is via a MicroService that is known as the Orchestrator (*aka* Orchestrator MicroService).  REST clients will send their requests to the Orchestrator MicroService.

All the other MicroServices are named according to how you want to name them, and each request sent by a REST client to the Orchestrator service is forwarded by it to the MicroService that has been specified to handle the API.

Usually, the Orchestrator does not handle any APIs directly itself, but it can if you wish.

In our example we’ll have 3 MicroServices:

- **orchestrator**
- **login_service** - this will handle the login API
- **info_service** - once logged in, you’ll be able to send a query to this MicroService


## JSON Web Tokens

QEWD automatically uses JSON Web Tokens (JWTs) to maintain security between the MicroServices, and returns its JWTs to the REST client as part of the response.  Your REST client can make use of the JWT for its own purposes, but the JWT **must** be returned as a Bearer Token with all REST requests, except for APIs that you specifically tell QEWD-Up to ignore the JWT.

The QEWD-generated JWT is added to your requests using the HTTP Authorization Header:

      Authorization: Bearer {{JWT}}

For example:

      Authorization: Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJleHAiOjE1NDI2MzMwO……etc

See later how this works.

## Defining Your APIs

Create a folder for your application / suite of APIs.  I'm going to name my example *microserviceExample* (eg using the file path *~/microserviceExample*).  Also create sub-folders beneath it as shown below (use the sub-folder names exactly as shown):


        ~/microserviceExample
            |
            |— configuration
            |
            |— login_service
            |
            |— info_service
            |

You **always** have a *configuration* folder.  The other folder names are up to you - create one for each of your MicroServices.


Create two text files in the configuration folder:


        ~/microserviceExample
            |
            |— configuration
            |            |
            |            |— routes.json
            |            |
            |            |— config.json
            |
            |— login_service
            |
            |— info_service
            |


### The *config.json* File

You **MUST** create a file named *config.json*.  This file tells QEWD to use the QEWD-Up mechanism and also defines the physical endpoint details of your MicroServices, for example we’ll use:

      {
        "qewd_up": true,
        "microservices": [
          {
            "name": "login_service",
            "host": "http://192.168.1.77",
            "port": 8081,
            "qewd": {
              "serverName": "Login MicroService"
            }
          },
          {
            "name": "info_service",
            "host": "http://192.168.1.77",
            "port": 8082,
            "qewd": {
              "serverName": "Info MicroService"
            }
          }
        ]
      }

You can see that the MicroServices are defined in the *microservices* array which contains one or more MicroService objects, each defining:

- **name** - the MicroService name (which must match the MicroService folder names that we previously created)
- **host** - the Host endpoint IP address (or domain name) and port.  http:// or https:// must prefix this value
- **port** - the port on which the MicroService QEWD instance will be listening

Optionally, if you want to use the *qewd-monitor* application with the MicroService (it is enabled by default), then you can specify the name that will appear in the *qewd-monitor* main page.  In the example above you can see we’re specifying this using the **qewd.serverName** property for each MicroService.

We’re going to run the Orchestrator and the two MicroServices on the same physical host machine, but they’ll each listen on a different port.

QEWD-Up will automatically generate a unique Uid-formatted Secret string that will be used to sign and authenticate the QEWD-generated JWTs.  You'll see this appearing in your *config.json* file after you run up the Orchestrator MicroService for the first time, eg:

        "jwt": {
          "secret": "b3de07f4-d2be-4337-b77c-4caf977f5199"
        }

This ensures that all the MicroServices share this same secret.

Optionally, the *config.json* file also allows you to specify how you want to configure QEWD itself on each MicroService.  QEWD-Up will apply sensible default settings that will be good enough for now.  See later in this document for more details on the *config.json* file and how to configure QEWD differently from the QEWD-Up defaults.


### The *routes.json* File

You **MUST** create a file named *routes.json*.   This will contain the definition of your REST routes.  As its file extension implies, its contents must be correctly-structured JSON, describing the list of REST routes that your system will support.  Each route is described in terms of:

- **uri**: the URI path
- **method**: the HTTP method
- **handler**: the name of the handler module that will perform the work of this API
- **on_microservice**: the name of the MicroService in which the handler module is defined and on which it will run
- **authenticate**: optionally, set this property to *false* in order to allow the API to be invoked without a JWT being present in the incoming request.  

The routes are described as an array of route objects, eg let’s use this example

      [
        {
          "uri": "/api/info/info",
          "method": "GET",
          "handler": "getInfo",
          "on_microservice": "info_service" 
        },
        {
          "uri": "/api/login",
          "method": "POST",
          "handler": "login",
          "on_microservice": "login_service",
          "authenticate": false
        }
      ]

You can describe as many routes as you wish in this file.  The syntax MUST be strict JSON - ie all property names and text-string values must be double-quoted.

In the example above:

- the first route defines an API whose handler method will be invoked on the Orchestrator MicroService.

- the second and third routes include the **on_microservice** property which tells QEWD-Up the MicroService on which to invoke the specified **handler** module.

- the third route includes the property **authenticate: false** which tells QEWD-Up that it will be invoked without first checking for a valid JWT


### Defining Your MicroService API Handlers

You define your API Handlers within the *apis* folder.  First create a sub-folder for each *handler* property name that you defined in the *routes.json* file (see above).  Then, within each of these handler sub-folders, create the module file that defines what the handler actually does.  You can name this file either *handler.js* or *index.js*.

For example, using the *routes.json* example above, you'd create:

        ~/microserviceExample
            |
            |— configuration
            |            |
            |            |— routes.json
            |            |
            |            |— config.json
            |
            |— login_service
            |            |
            |            |— login
            |                  |
            |                  |— handler.js
            |
            |— info_service
            |            |
            |            |— getInfo
            |                  |
            |                  |— handler.js
            |
  

QEWD REST handler modules export a function with 2 arguments:

- **args**: an object that contains the content of your REST request, including its path, headers, HTTP method, any querystring values and any body payload.  It also contains the QEWD MicroService JWT.

- **finished**: the QEWD function that you use to end your handler.  This function releases the QEWD worker process that handled your module back to QEWD's available worker pool, and tells QEWD to return the object you provide as its argument as a JSON response to the REST client that sent the original request.


Here's the example handler modules:

#### login/handler.js

    module.exports = function(args, finished) {
      var username = args.req.body.username;
      var password = args.req.body.password;
      var jwt = args.session;
      if (username === 'rob' && password === 'secret') {
        jwt.userText = 'Welcome Rob';
        jwt.username = username;
        jwt.authenticated = true;
        jwt.timeout = 1200;
        finished({ok: true});
      }
      else {
        finished({error: 'Invalid login'});
      }
    };


In this example I'm simply hard-coding the authentication logic, allowing only a username of *rob* and a password of *secret*.  Any other username/password will return an error JSON object.

If login is successful, then I'm adding information to the JWT.  The *authenticated* and *timeout* properties (or *claim* in JWT parlance) are special, QEWD-reserved ones that are used by QEWD's JWT authentication:

- **authenticated**: determines that the user has been correctly authenticated each time the JWT is tested within the QEWD MicroServices
- **timeout**: sets the JWT timeout which, in turn, updates the JWT *exp* claim each time a handler module is invoked


#### getInfo/handler.js

      module.exports = function(args, finished) {
        finished({
          info: {
            microService: 'info_service',
            arch: process.arch,
            platform: process.platform,
            versions: process.versions,
            memory: process.memoryUsage(),
          }
        });
      };

In this simple example, I'm simply returning some information about the info_service MicroService run-time environment.

## Starting the MicroServices

First fire up the Orchestrator QEWD Docker Container, eg:

    docker run -it --name orchestrator --rm -p 8080:8080 -v ~/microserviceExample:/opt/qewd/mapped rtweed/qewd-server

Note: you may need to add sudo to the start of this command, depending on how you configured your Docker environment.

If you’re using a Raspberry Pi, simply substitute the Docker container name *rtweed/qewd-server-rpi*, eg:

    docker run -it --name orchestrator --rm -p 8080:8080 -v ~/microserviceExample:/opt/qewd/mapped rtweed/qewd-server-rpi


By default, QEWD listens within the Docker Container on port 8080.  The command examples above are mapping this to port 8080 on your host machine.  If you want to use a different host port, just change the -p directive, eg to listen on port 3000:

    docker run -it --name orchestrator --rm -p 3000:8080 -v ~/microserviceExample:/opt/qewd/mapped rtweed/qewd-server

Your application's configuration and API files are mapped into the Docker Container using this parameter:

    -v ~/microServiceExample:/opt/qewd/mapped

**Always** map your QEWD-Up Application Folder to */opt/qewd/mapped*


Secondly, in a separate terminal window, start up the *login_service* MicroService:

       docker run -it --name login --rm -p 8081:8080 -v ~/microserviceExample:/opt/qewd/mapped -e microservice="login_service" rtweed/qewd-server

Note how we’ve specified an environment variable to tell QEWD-Up which MicroService this is:

       -e microservice="login_service" 


And finally, in a third terminal window, start up the *info_service* MicroService:

       docker run -it --name login --rm -p 8082:8080 -v ~/microserviceExample:/opt/qewd/mapped -e microservice=“info_service" rtweed/qewd-server


**IMPORTANT NOTE**: you must ensure that the external port that you specify in the *-p* directive matches that defined in the *config.json* file for the MicroService named in the Docker environment variable.  In our example we defined the following:

            "name": "login_service",
            "host": "http://192.168.1.77",
            "port": 8081

            ...

            "name": "info_service",
            "host": "http://192.168.1.77",
            "port": 8082


## Running Your APIs

With everything running, you can now try out the APIs.  

First we must use the Login API.  Using a REST client:

      POST http://192.168.1.100:8080/api/login
      Content-type: application/json

        with a body payload containing

        {
          "username": "rob",
          "password": "secret"  
        }

**Note**: Change the IP address to match that of the host machine that is running the Orchestrator Service.

You should see activity in the console logs for both the Orchestrator and Login QEWD instances, and back should come a response looking something like this:

      {
          "ok": true,
          "token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJleHAiOjE1NDI2Mz……etc”
      }

You're now ready to try the other API, but in order for it to work, you need to include the JWT that was returned to us as the token property in the */api/login* response.  As described earlier, you need to add it as a *Bearer Token* in the HTTP *Authorization* request header: *ie* the *Authorization* header value must be the word *Bearer * followed by the JWT value.

So try this:


      GET http://192.168.1.100:8080/api/info/info
      Content-type: application/json
      Authorization: Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJleHAiOjE1NDI2Mz……etc


and you should get the response:

    {
      "info": {
          "microService": "info_service",
          "arch": "x64",
          "platform": "linux",
          "versions": {
              "http_parser": "2.8.0",
              "node": "10.12.0",
              "v8": "6.8.275.32-node.35",
              "uv": "1.23.2",
              "zlib": "1.2.11",
              "ares": "1.14.0",
              "modules": "64",
              "nghttp2": "1.34.0",
              "napi": "3",
              "openssl": "1.1.0i",
              "icu": "62.1",
              "unicode": "11.0",
              "cldr": "33.1",
              "tz": "2018e"
          },
          "memory": {
              "rss": 52363264,
              "heapTotal": 19120128,
              "heapUsed": 9825976,
              "external": 177816
          }
      },
      "token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJleHAiOjE1NDI3MjA4MzcsI....etc”
     }

Notice how the response includes a new, updated JWT, returned as a property named *token*.


## Inspecting the JWT

One of the features of JWTs is that you can decode them and see what they contain.  Try copying the JWT value returned in the *token* property of the */api/login* response.  Then paste it into the JWT Debugging window at *https://jwt.io*.  Look in the *Decoded* panel at the *PAYLOAD* section and you'll see something like:

    {
      "exp": 1544607641,
      "iat": 1544606441,
      "iss": "qewd.jwt",
      "application": "login_service",
      "timeout": 1200,
      "qewd": "9585569d6b0acef7b320ca5f200a47ec99b55a29f7808f3d84a937d138497a123d67174a7e56fca9b1626ed040c27f2feef094b25e522ec47cfb3152784fe292edc5d410bfe5f661bb7b2b31779c86e1e747b98741f7175b8671a1953fae0542",
      "userText": "Welcome Rob",
      "username": "rob"
    }

Some of these JWT claims (or properties) are created and maintains internally within QEWD, but you should recognise three that we created in our *login/handler.js* module's logic:

        jwt.userText = 'Welcome Rob';
        jwt.username = username;
        jwt.timeout = 1200;

**Note**: although you can read the contents of a JWT, you can't modify its contents without knowing the secret that is used to digitally sign the JWT.


## How JWTs Protect Your APIs

Without you needing to write anything other than the login credential checking, QEWD protects access to your APIs automatically via the JWT it creates and maintains for you across the MicroServices. The following examples will demonstrate how this works:

Try sending the */api/login* request with invalid username/password credentials.  You should get back an error response with an HTTP Status Code of 400 and a response payload of:

    {
      "error": "Invalid login"
    }

Notice that no JWT is returned with error responses, and without a JWT, you can't access the other APIs.

For example, try sending the */api/info/info* request without an *Authorization* header.  You should get back an error response with an HTTP Status Code of 400 and a response payload of:

    {
      "error": "Authorization Header missing or JWT not found in header (expected format: Bearer {{JWT}}"
    }

Because JWTs are digitally signed using a secret that your REST client doesn't have access to, you can't tamper with the JWT or make one up yourself.  For example, try sending the */api/info/info* request with a valid *Authorization* header, but make a change to one or two of the characters within the JWT.  You should get back an error response with an HTTP Status Code of 400 and a response payload of:

    {
      "error": "Invalid JWT: Error: Signature verification failed"
    }

Finally, see what happens if you try to use a valid but expired JWT in the Authorization header (ie wait for 20 minutes or more after */api/login*). You should get back an error response with an HTTP Status Code of 400 and a response payload of:

    {
      "error": "Invalid JWT: Error: Token expired"
    }


## Installing Additional Node.js Modules

if you need to use additional Node.js modules (ie ones not automatically included with QEWD itself) in any of your application's MicroServices, you can do this by adding the file *install_modules.json*, eg:

        ~/microserviceExample
            |
            |— install_modules.json
            |
            |— configuration
            |            |
            |            |— routes.json
            |            |
            |            |— config.json
            |

This file should contain a JSON array, listing the names of the modules you want loaded from NPM.  For example:

      [
        "a-find",
        "body-parser-xml",
        "multer"
      ]

The modules in this file are loaded from NPM when one of your MicroService Containers is next started.  Modules are saved into a *node_modules* folder in your mapped host file volume.  As a result, the next time(s) you start/restart any of your MicroService Containers, your additional modules are already available for use and don't need to be reloaded.

If you later modify your *install_modules.json* file and add new modules, they will be loaded from NPM when a MicroService Container is next restarted.

So, after starting one of your MicroServices, you'll see the *node_modules* folder that will have been created, eg:

        ~/microserviceExample
            |
            |— install_modules.json
            |
            |— node_modules
            |            |
            |            a_find
            |            ...etc
            |
            |— configuration
            |            |
            |            |— routes.json
            |            |
            |            |— config.json


# Native QEWD Monolith

## Pre-requisites 

To use this mode, you must first install Node.js (version 8 or later is recommended) and the [YottaDB](https://yottadb.com/) database.  QEWD-Up's Native mode is designed to run on Linux or Unix platforms (including Virtual Machines).

Don't worry if you've never installed Node.js or YottaDB before: you can simply run this automated script on a new Linux machine or VM:

       cd ~
       wget https://raw.githubusercontent.com/robtweed/qewd/master/installers/install_ydb_and_node.sh
       source install_ydb_and_node.sh

This script file will first install something called NVM and then use that to install the latest version of Node.js 10.x.  It also installs the latest version of YottaDB and configures it ready for use with QEWD.


## Setting Up QEWD-Up

Create a folder for your application/suite of APIs.  I'm going to name my example *nativeExample* (eg using the file path *~/nativeExample*).  Also create sub-folders beneath it as shown below (use the sub-folder names exactly as shown):


        ~/nativeExample
            |
            |— configuration
            |
            |— apis
            |

In the configuration folder, create a text file named *routes.json*:


        ~/nativeExample
            |
            |— configuration
            |            |
            |            |— routes.json
            |
            |— apis
            |


### The *routes.json* File

This file contains the definitions of your REST routes, expressed as a JSON array of route objects.  Each route is described in terms of:

- the URI path
- the HTTP method
- the name of the handler module that will perform the work of this API

*eg* here’s the definition of a single API:

      [
        {
          "uri": "/api/info",
          "method": "GET",
          "handler": "getInfo"
        }
      ]

You can describe as many routes as you wish in this file.  The syntax MUST be strict JSON - ie all property names and text-string values must be double-quoted.


### The *config.json* File

By Default, QEWD-Up applies a set of sensible default settings to the QEWD environment that will run your APIs.  If the defaults are satisfactory, then you don't need to create a *config.json* file. If you want different settings for QEWD (eg a larger Worker pool size), then here's what to do:

Create a text file named *config.json* within your configuration sub-folder, ie:

        ~/nativeExample
            |
            |— configuration
            |            |
            |            |— routes.json
            |            |
            |            |— config.json
            |
            |— apis
            |


The *config.json* file provides QEWD-Up with instructions on how to configure QEWD.  As its file extension implies, its contents must be correctly-structured JSON.  Here's a simple example that increases the QEWD Worker pool size from the default of 2 to 4, and tells QEWD's integrated Express Web Server to listen on port 3000:

      {
        qewd: {
          poolSize: 4,
          port: 3000
        }
      }


## Defining Your API Handlers

You define your API Handlers within the *apis* folder.  First create a sub-folder for each *handler* property name that you defined in the *routes.json* file (see above).  For example, using the *routes.json* example above, you'd create:

        ~/nativeExample
            |
            |— configuration
            |            |
            |            |— routes.json
            |— apis
            |    |
            |    |— getInfo
            |


Within each handler sub-folder, you now create a module file that defines the code that will be invoked when the API route is requested.  This module file can be named either *handler.js* or *index.js".  For example:

        ~/nativeExample
            |
            |— configuration
            |            |
            |            |— routes.json
            |— apis
            |    |
            |    |— getInfo
            |            |
            |            |— handler.js



Here's an example *handler.js* file for the *getInfo* API:

      module.exports = function(args, finished) {
        finished({
          info: {
            server: 'Qewd-Up Native',
            arch: process.arch,
            platform: process.platform,
            versions: process.versions,
            memory: process.memoryUsage(),
          }
        });
      };

If you’ve written QEWD REST handlers, you’ll recognise this format.  

In summary, simply export a function with 2 arguments:

- **args**: an object that contains the content of your REST request, including its path, headers, HTTP method, any querystring values and any body payload

- **finished**: the QEWD function that you use to end your handler.  This function releases the QEWD worker process that handled your module back to QEWD's available worker pool, and tells QEWD to return the object you provide as its argument as a JSON response to the REST client that sent the original request.


## Create a *package.json* File

Create a file named package.json in your top-level application directory, eg in our case:

        ~/nativeExample
            |
            |— package.json
            |
            |— configuration
            |            |
            |            |— routes.json
            |— apis
            |    |
            |    |— getInfo
            |            |
            |            |— handler.js

The easiest thing is to copy the example below and use it as a template for your package.json:

      {
        "name": "qewd-up",
        "version": "1.0.0",
        "description": "Automated QEWD Builder",
        "author": "Rob Tweed <rtweed@mgateway.com>",
        "scripts": {
          "start": "node node_modules/qewd/up/run_native"
        },
        "dependencies": {
          "qewd": "",
          "qewd-transform-json": "",
          "nodem": ""
        }
      }

If your handler modules have additional *dependencies*, add them to the package.json, otherwise just use the template shown above and leave it unchanged.


## Starting QEWD-Up

You're now ready to start up QEWD-Up.

First you need to use NPM to install everything that’s needed by QEWD-Up and QEWD itself.  When you installed Node.js, NPM will have also been installed automatically.

This is a one-off step that you don’t need to repeat (unless you add more dependencies to your handlers later):

      cd ~/nativeExample
      npm install

Once that’s finished, you’re ready to go!  Just type:

       npm start


QEWD is now ready and you can try out your APIs.


## Running Your APIs

Now you can try out your API(s).  If you used the default QEWD-Up configuration, QEWD will be listening on port 8080.  So, point a browser at:

       http://192.168.1.100:8080/api/info

        (change the IP address as appropriate)

and back should come the results from your API handler module, eg:

      {
          "info": {
              "server": "Qewd-Up Native",
              "arch": "x64",
              "platform": "linux",
              "versions": {
                  "http_parser": "2.8.0",
                  "node": "10.12.0",
                  "v8": "6.8.275.32-node.35",
                  "uv": "1.23.2",
                  "zlib": "1.2.11",
                  "ares": "1.14.0",
                  "modules": "64",
                  "nghttp2": "1.34.0",
                  "napi": "3",
                  "openssl": "1.1.0i",
                  "icu": "62.1",
                  "unicode": "11.0",
                  "cldr": "33.1",
                  "tz": "2018e"
              },
              "memory": {
                  "rss": 52396032,
                  "heapTotal": 11780096,
                  "heapUsed": 7756656,
                  "external": 28323
              }
          }
      }

That’s it - your API is up and working!

You can now add more routes and their associated handler methods.  If you do, you must restart QEWD-Up.

To stop your running QEWD instance, just type CTRL & C.

To restart QEWD-Up, just type *npm start* again.


## Installing Additional Node.js Modules

if you need to use additional Node.js modules (ie ones not automatically included with QEWD itself), you can do this by adding them to the *package.json* **dependencies**.  For example:

      {
        "name": "qewd-up",
        "version": "1.0.0",
        "description": "Automated QEWD Builder",
        "author": "Rob Tweed <rtweed@mgateway.com>",
        "scripts": {
          "start": "node node_modules/qewd/up/run_native"
        },
        "dependencies": {
          "qewd": "",
          "qewd-transform-json": "",
          "nodem": "",
          "a-find": "",
          "multer": ""
        }
      }




