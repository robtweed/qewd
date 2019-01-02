#Contents

- [QEWD-Up Life Cycle Events](#qewd-up-life-cycle-events)
- [Life Cycle Points](#life-cycle-points)
  - [Monolithic QEWD-Up Application](#monolithic-qewd-up-application)
    - [Available Life-Cycle Hooks in Chronological Sequence](#available-life-cycle-hooks-in-chronological-sequence)
  - [MicroService-based QEWD-Up Application](#microService-based-qewd-up-application)
    - [Available MicroService Life-Cycle Hooks in Chronological Sequence](#available-microservice-life-cycle-hooks-in-chronological-sequence)
- [Life-Cycle Hook Specifications](#life-cycle-hook-specifications)
  - [addMiddleware](#addmiddleware)
  - [onStarted](#onstarted)
  - [onWSRequest](#onwsrequest)
  - [beforeHandler](#beforehandler)
  - [onMSResponse](#onmsresponse)
  - [onOrchResponse](#onorchresponse)
  - [onWSResponse](#onwsresponse)

# QEWD-Up Life Cycle Events

QEWD-Up provides hooks at various points in the life-cycle of an API, allowing you fine control over the behaviour of your API, whilst allowing you to document your API Life-Cycles in an easy-to-find and easy-to-understand way.

# Life Cycle Points

The points at which you can intercept the life-cycle of an API depends on whether your application is a monolithic one or implemented as a set of MicroServices.

## Monolithic QEWD-Up Application

Understanding how and why to control the life-cycle of your monolithic application APIs requires an understanding of QEWD's Master Process / Worker Process architecture.  **Note**: this applies to both Native and Docker versions of QEWD Monolithic applications.

### The QEWD Run-Time Environment

This is described [diagrammatically here](https://www.slideshare.net/robtweed/qewdjs-json-web-tokens-microservices) in slides 4 - 40.

In summary, all incoming requests are received by QEWD's Master Process.  In the case of REST API requests, these are received by the embedded Express web server.

The requests are then placed in a queue within the Master Process.  By default, any request payloads are assumed to be JSON-formatted, and the request is passed unchanged from Express to QEWD's queue.

When a new item is added to the queue, the Master Process tries to send it to an available Worker Process.  By default, QEWD-Up configures QEWD with a pool of 2 Worker Processes, but you can modify this to whatever pool size you require in the *config.json* file.

Your API handler module is invoked within the Worker process that receives the incoming request.  Your API handler module has exclusive access to the Worker process, so, unusually for a Node.js environment, your handler module does not need to be concerned about concurrency.  Additionally, the Worker process has synchronous access to the integrated persistent JSON database.

Your API handler module can make use of any 3rd party Node.js modules you wish to use, and, subject to network availability, your API handler module can also send requests to external services and resources.

Once your handler logic is completed, you must invoke QEWD's *finished* function which does two key things:

- it tells QEWD that you have finished with the Worker process;
- it allows you to define the JSON response object that you want to return to the REST client

The *finished* function actually sends the JSON response object to the QEWD Master process, and, on receipt of this message, the Master process returns the Worker process back to the available pool, ready to handle the next queued request.

Finally, the Master process sends the JSON response to the REST Client.  By default, no changes are made to the JSON response by the Master process: QEWD assumes that the REST Client is expecting JSON-formatted.

### Available Life-Cycle Hooks in Chronological Sequence

- **addMiddleware**: triggered during QEWD's Master process startup, just after its integrated Web Server (Express by default) is configured.  This hook allows you to customise the Web Server middleware, eg to handle XML, set payload size limits etc.  It can optionally be used together with the **config.json** file's *qewd.bodyParser* property to customise, replace or override the standard JSON body parsing.

- **onStarted**: triggered after QEWD's Master process starts and before any APIs are allowed to be handled.  It gives you access to QEWD's *this* object and can be used for complex situations, for example where you want to integrate QEWD with a third-party module that provides a turnkey server environment.  You can often use this kook instead of the **addMiddleware** one, as it also gives you access to the Web Server's *app* object.  This hook is invoked in QEWD's Master process.

- **onWSRequest**: triggered as part of your Web Server's Middleware chain, before each incoming API request is routed to its appropriate handler method.  Its usual purpose is to allow you to modify some aspect(s) of the incoming request, for example modifying and/or adding HTTP headers, and/or modifying the request payload.  This hook is invoked in the QEWD Master process, before the incoming request is queued, and applies to **ALL** incoming requests.

- **beforeHandler**: triggered in the QEWD Worker process that handles the incoming request **before** your handler method is invoked. This hook is applied to **all** incoming requests.  Typically it is used to define logic that should be applied to all incoming requests, for example to test user authentication.  The *beforeHandler* can be defined to accept or reject requests based on their headers and/or content, and return an appropriate error response for requests that are rejected.  Rejected messages will **not** invoke your handler method.  Because this hook is invoked in the QEWD Worker process, it has access to the integrated persistent JSON database and/or QEWD Session (if appropriate).

- **onWSResponse**: triggered in the QEWD Master process on receipt of the response from the Worker process and before the JSON response is returned to the REST Client.  Typically, this hook is used to modify the response content, eg adding or changing response headers and/or modifying the payload format (eg from JSON to XML).  This hook is applied to **all** responses.  **Note**: if you implement an *onWSResponse* hook, then you take on responsibility for sending all responses back to the REST Client, including error responses.


## MicroService-based QEWD-Up Application

Understanding how and why to control the life-cycle of your MicroService application APIs requires an understanding of:

- **each MicroService instance**: Each MicroService is an instance of QEWD, with its Master Process / Worker Process architecture;
- ** how QEWD's MicroServices interoperate**.  In summary, all incoming requests from REST Clients are handled by a MicroService known as the *Orchestrator*.  This communicates with all your other MicroService QEWD instances over persistent WebSocket connections.  The *Orchestrator* MicroService routes incoming requests to the appropriate MicroService that is designated to handle that request.  Responses are returned to the *Orchestrator* which then forwards them to the REST client.

### The QEWD Run-Time Environment

Each MicroService (including the *Orchestrator*) is a complete QEWD instance, described [diagrammatically here](https://www.slideshare.net/robtweed/qewdjs-json-web-tokens-microservices) in slides 4 - 40.

How the MicroServices communicate and interoperate is described [diagrammatically here](https://www.slideshare.net/robtweed/qewdjs-json-web-tokens-microservices) in slides 100 - 115.

In summary, all incoming requests are received by each QEWD instance's Master Process.  

In the case of REST API requests sent from a REST Client and received by the Orchestrator, these are received by the embedded web server (Express by default).

In the case of WebSocket messages received by your other MicroService QEWD instances, these are handled by the standard Node.js **socket.io** module which is included and automatically configured within QEWD.

Requests received by the *Orchestrator* are repackaged as JSON messages and immediately routed within its Master Process via the appropriate WebSocket connection to the MicroService designated to handle the request.

Requests received by your other MicroServices are placed in a queue within the Master Process.  When a new item is added to this queue, the Master Process tries to send it to an available Worker Process.  By default, QEWD-Up configures QEWD with a pool of 2 Worker Processes, but you can modify this to whatever pool size you require in the *config.json* file.

Your API handler module is invoked within the Worker process that receives the incoming request.  Your API handler module has exclusive access to the Worker process, so, unusually for a Node.js environment, your handler module does not need to be concerned about concurrency.  Additionally, the Worker process has synchronous access to the integrated persistent JSON database.

Your API handler module can make use of any 3rd party Node.js modules you wish to use, and, subject to network availability, your API handler module can also send requests to external services and resources.

Once your handler logic is completed, you must invoke QEWD's *finished* function which does two key things:

- it tells QEWD that you have finished with the Worker process;
- it allows you to define the JSON response object that you want to return to the REST client

The *finished* function actually sends the JSON response object to the QEWD Master process, and, on receipt of this message, the Master process returns the Worker process back to the available pool, ready to handle the next queued request.

Your MicroService's Master process returns the JSON response to the *Orchestrator* MicroService via the WebSocket connection.  

On receipt of the response from another MicroService, the *Orchestrator* returns the response to the REST Client.  By default, no changes are made to the JSON response by the Orchestrator


### Available MicroService Life-Cycle Hooks in Chronological Sequence


#### Startup of Each MicroService

- **addMiddleware**: this is appropriate only to the *Orchestrator*.  It is triggered during QEWD's Master process startup, just after its integrated Web Server (Express by default) is configured.  This hook allows you to customise the Web Server middleware, eg to handle XML, set payload size limits etc.  It can optionally be used together with the **config.json** file's *qewd.bodyParser* property to customise, replace or override the standard JSON body parsing.

- **onStarted**: this is triggered after QEWD's Master process starts and before any APIs are allowed to be handled.  It gives you access to QEWD's *this* object and can be used for complex situations, for example where you want to integrate QEWD with a third-party module that provides a turnkey server environment.  On the *Orchestrator* you can often use this kook instead of the **addMiddleware** one, as it also gives you access to the Web Server's *app* object.  This hook is invoked in QEWD's Master process.


#### Request Received by Orchestrator

- **onWSRequest**: triggered as part of your Orchestrator's Middelware chain, and before each incoming API request is routed to its appropriate handling MicroService destination.  Its usual purpose is to allow you to modify some aspect(s) of the incoming request, for example modifying and/or adding HTTP headers, and/or modifying the request payload.  This hook is invoked in the QEWD Master process, before the incoming request is forwarded to its handling MicroService, and applies to **ALL** incoming requests.


#### Request from Orchestrator Received by Handling MicroService

- **onMSResponse**: applied to a specific API and triggered on the Master process on receipt of the response from the Worker process that handled the API.  This allows you to intercept the response from your API handler and optionally invoke one or more additional API requests that may be sent to be handled on other MicroServices.  This allows you, for example, to build up a composite response from a series of chained APIs spread across multiple MicroServices

#### Response received by Orchestrator from MicroService

- **onOrchResponse**: applied to a specific API and triggered on the Orchestrator's Master process before the response is returned to the REST Client. This hook allows you to do several things, including:

  - repackaging/reformatting the response
  - intercepting the flow and sending out one or more new API requests to the MicroServices that will handle them, compiling a composite response that will ultimately be returned to the REST Client

- **onWSResponse**: triggered in the QEWD Master process on receipt of **all** responses from a MicroService and before the JSON response is returned to the REST Client.  Typically, this hook is used to globally modify the response content, eg adding or changing response headers and/or modifying the payload format (eg from JSON to XML).  **Note**: if you implement an *onWSResponse* hook, then you take on responsibility for sending all responses back to the REST Client, including error responses.


# Life-Cycle Hook Specifications

## addMiddleware

### Filename and Directory location

The filename is **addMiddleware.js**.  The name is case-sensitive.

Its placement depends on what mode you are using and/or microservice you are specifying it for

#### Monolith

        ~/dockerExample
            |
            |— addMiddleware.js
            |
            |— configuration
            |
            |— apis
            |

#### MicroService: Orchestrator

        ~/microserviceExample
            |
            |— configuration
            |
            |— orchestrator
            |         |
            |         |— addMiddleware.js


#### MicroService: Other Microservice

*eg* for a MicroService named *login_service*:

        ~/microserviceExample
            |
            |— configuration
            |
            |— login_service
            |         |
            |         |— addMiddleware.js


### Module structure

Your *addModule.js* file should export a function of the structure shown below:

      module.exports = function(bodyParser, app, qewdRouter, config) {
        // add/ define / configure your WebServer middleware
      };

### Module Function Arguments

#### bodyParser

This is the bodyParser object that has been loaded and configured for the Web Server.  By default, QEWD uses the *body-parser* module and configures it to handle and parse JSON content.

if you want to use the *body-parser* module, but apply different/additional configuration settings to it, then, in your *config.json* file, use the property *qewd.bodyParser* to specify it.

For example, in Monolith mode: 

      {
        "qewd_up": true,
        "qewd": {
          "bodyParser": "body-parser"
        }
      }

or in the Orchestrator MicroService: 

      {
        "qewd_up": true,
        "orchestrator": {
          "qewd": {
            "bodyParser": "body-parser"
          }
        }
      }

This will stop QEWD from configuring it automatically.

If you want to use a different bodyParser module, then you must first specify it in your *config.json* file, eg:

      {
        "qewd_up": true,
        "qewd": {
          "bodyParser": "body-parse"
        }
      }

and then configure it within your *addMiddleware** module.


#### app

This is the WebServer (eg Express) object.  You can use this to, for example, specify your own custom *app.use* directives.

For example, here is an *addMiddleware* module that configures payload size limits (assuming *qewd.bodyParser* was specified in the *config.json* file):


      module.exports = function(bodyParser, app) {
        app.use(bodyParser.json({limit: '1mb'}));
        app.use(bodyParser.urlencoded({limit: '1mb', extended: true}));
      };

#### qewdRouter

This is QEWD's REST API routing function.  You can use this to insert a middleware chain prior to QEWD taking over the API routing.  For example:

      var cors = require('cors');
      module.exports = function(bodyParser, app, qewdRouter) {
        app.use('/api/login', cors(), qewdRouter());
      };


Note that for the above to work, you'd need to include *cors* in your *install_modules.json* file, eg:

      [
        "cors"
      ]

QEWD-Up will ensure that this is loaded from NPM before starting QEWD.

#### config

This is the *config* object that contains your QEWD instance's configuration settings.  It can be useful for conditional logic, for example that determines the configured database type, eg:

      module.exports = function(bodyParser, app, qewdRouter, config) {
        if (config.database.type === 'gtm') {
          // ... etc
        }
      };

You can modify the values within the config object, but you should take care doing this.  Note that by the time the *addMiddleware* hook is invoked, changing some *config* properties may not have any effect.  You should try to set the values you require within the *qewd* property in the relevant part of your *config.json* file.


## onStarted

### Filename and Directory location

The filename is **onStarted.js**.  Its name is case-sensitive.

Its placement depends on what mode you are using and/or microservice you are specifying it for

#### Monolith

        ~/dockerExample
            |
            |— onStarted.js
            |
            |— configuration
            |
            |— apis
            |

#### MicroService: Orchestrator

        ~/microserviceExample
            |
            |— configuration
            |
            |— orchestrator
            |         |
            |         |— onStarted.js


#### MicroService: Other Microservice

*eg* for a MicroService named *login_service*:

        ~/microserviceExample
            |
            |— configuration
            |
            |— login_service
            |         |
            |         |— onStarted.js


### Module structure

Your *onStarted.js* file should export a function of the structure shown below:

      module.exports = function(config, app, qewdRouter) {
        // perform startup tasks
      };

### Module Function Context

The **this** object within your *onStarted* module is the QEWD Master Process object, so you have access to all its properties and method.

### Module Function Arguments

#### config

This is the *config* object that contains your QEWD instance's configuration settings.  It can be useful for conditional logic, for example that determines the configured database type, eg:

      module.exports = function(config) {
        if (config.database.type === 'gtm') {
          // ... etc
        }
      };

You can modify the values within the config object, but you should take care doing this.  Note that by the time the *onStarted* hook is invoked, changing some *config* properties is unlikely to have any effect, as most of the startup actions that depend on them will have already taken place.  You should try to set the values you require within the *qewd* property in the relevant part of your *config.json* file.


#### app

This is the WebServer (eg Express) object.  You can use this to, for example, specify your own custom *app.use* directives.

For example, here is an *addMiddleware* module that configures payload size limits (assuming *qewd.bodyParser* was specified in the *config.json* file):


      module.exports = function(config, app) {
        app.use(bodyParser.json({limit: '1mb'}));
        app.use(bodyParser.urlencoded({limit: '1mb', extended: true}));
      };

#### qewdRouter

This is QEWD's REST API routing function.  You can use this to insert a middleware chain prior to QEWD taking over the API routing.  For example:

      var cors = require('cors');
      module.exports = function(config, app, qewdRouter) {
        app.use('/api/login', cors(), qewdRouter());
      };


Note that for the above to work, you'd need to include *cors* in your *install_modules.json* file, eg:

      [
        "cors"
      ]

QEWD-Up will ensure that this is loaded from NPM before starting QEWD.


## onWSRequest

### Filename and Directory location

The filename is **onWSRequest.js**.  Its name is case-sensitive.

The *onWSRequest* hook is only relevant to:

- a QEWD-Up Monolithic application;
- the Orchestrator MicroService in a QEWD-Up MicroService application

Its placement depends on what mode you are using and/or microservice you are specifying it for

#### Monolith

        ~/dockerExample
            |
            |— onWSrequest.js
            |
            |— configuration
            |
            |— apis
            |

#### MicroService: Orchestrator

        ~/microserviceExample
            |
            |— configuration
            |
            |— orchestrator
            |         |
            |         |— onWSRequest.js



### Module structure

Your *onWSRequest.js* file should export a function of the structure shown below:

      module.exports = function(req, res, next) {
        // perform onWSRequest processing
        next();
      };

### Module Function Arguments

#### req

The WebServer (eg Express by default) request object

#### res

The WebServer (eg Express by default) response object

#### next

The WebServer (eg Express by default) next() function, allowing control to be passed to the next function in the middleware chain.

### Example

This *onWSRequest* example implements CSRF protection for all incoming requests:

      module.exports = function(req, res, next) {

        function sendError(message) {
          res.set('content-length', message.length);
          res.status(400).send(message);
        }

        if (!req.headers) {
          return sendError('Invalid request: headers missing');
        }
        if (!req.headers['x-requested-with']) {
          return sendError('Invalid request: x-requested-with header missing');
        }
        if (req.headers['x-requested-with'] !== 'XMLHttpRequest') {
          return sendError('Invalid request: x-requested-with header invalid');
        }
        next();
      };




## beforeHandler


### Filename and Directory location

The filename is **beforeHandler.js**.  Its name is case-sensitive.

The *beforeHandler* hook is only relevant to:

- APIs invoked in Monolithic applications
- APIs that are invoked on the *Orchestrator* within MicroService applications

It is applied to **all** of the above API requests, and is invoked on the QEWD Worker process that handles the API

Its most common use is for determining whether or not the request has been authenticated, and rejecting un-authenticated or otherwise invalid requests before the appropriate API handler method is invoked.

Its placement depends on what mode you are using:

#### Monolith

        ~/dockerExample
            |
            |— configuration
            |
            |— apis
            |    |
            |    |— beforeHandler.js
            |

#### MicroService

        ~/microserviceExample
            |
            |— configuration
            |
            |— orchestrator
            |       |
            |      apis
            |       |
            |       |— beforeHandler.js



### Module structure

Your *beforeHandler.js* file should export a function of the structure shown below:

      module.exports = function(req, finished) {
        // beforeHandler logic here
      };

### Module Function Context

The *beforeHandler* module's **this** object is the QEWD Worker Process object.  This provides access to, for example:

- **this.db.use**: Giving access to a document within the integrated persistent JSON database
- **this.session**: The QEWD Session (if relevant)
- **this.userDefined**: Any custom objects that were defined at QEWD Startup

### Module Function Arguments

#### req

This is the version of the request object that is created by QEWD and transmitted to the Worker process.  Its most relevant/useful properties are as follows:

- **path**: The API route path, eg */api/info*
- **method**: The HTTP request method 
- **headers**: The HTTP request headers object.  You'll probably be most interested in the *headers.authorization* value which you can use to test
- **query**: The URL query string (if any), parsed into an object
- **body**: For POST/PUT requests, the request body payload (if any), parsed into an object
- **ip**: The IP Address of the location that was determined to have sent the request (which may be a router or gateway IP address)

#### finished

The QEWD Worker function that you should use if you want to reject the request and return an error message, eg:

      module.exports = function(req, finished) {
        if (!req.headers.authorization) {
          finished({error: 'Missing Authorization Header'});
          return false; // stops QEWD invoking your request's normal handler method
        }
        //... etc
      };

The *finished* function performs two tasks in QEWD:

- it defines the object to be returned to the REST Client
- it tells QEWD's Master process that you have finished with the Worker process, and it can be returned to the available pool

**Note:** If you invoke the *finished()* function, you **MUST** *return false* from your *beforeHandler* module.  Doing so instructs QEWD to bypass your normal handler method.  See the example above


## onMSResponse


### Filename and Directory location

The filename is **onMSResponse.js**.  Its name is case-sensitive.

The *onMSResponse* hook is only relevant to MicroService applications

It is applied to the specified API, and is invoked on the QEWD Master process of the MicroService that handled the API, on receipt of the handler response from the QEWD Worker process and before the MicroService returns its response to the Orchestrator (or other originating MicroService).

The *onMSResponse* hook allows you to intercept the response from your API's handler, and send one or more further API requests, eg to other MicroServices, in order to build up a complex, composite response.

Because the *onMSResponse* runs on the MicroService that handles the API, if you send out other API requests, those APIs must be available for use on your handling MicroService.  This is specified in the route definitions in the *routes.json* file, via the *from_microservices* property. For example, if we wanted to use the */api/info/demographics* API in an *onHandler* hook for the */api/login* API, we'd need this defined in the *routes.json* file:

      {
        "uri": "/api/info/demographics", 
        "method": "GET",
        "handler": "getDemographics",
        "on_microservice": "info_service",
        "from_microservices": [
          "login_service"
        ]
      }


An *onMSResponse* module is placed is along-side the API handler module, eg: for the API defined in **routes.json**:

  {
    "uri": "/api/login",
    "method": "POST",
    "handler": "login",
    "on_microservice": "login_service",
    "authenticate": false
  }


You would define an *onMSResponse* hook by adding the *onMSResponse.js* module file here:


        ~/microserviceExample
            |
            |— configuration
            |
            |— login_service
            |         |
            |        login
            |           |
            |           |— index.js
            |           |
            |           |— onMSResponse.js



### Module structure

Your *onMSResponse.js* file should export a function of the structure shown below:

      module.exports = function(message, jwt, forward, sendBack) {
        // onRequest logic here
      };


### Module Function Context

The *onMSResponse* module's **this** object is the QEWD Master Process object for the MicroService.


### Module Function Arguments

#### message

This is the response object you sent from your handler (ie the object you created as the *finished()* function's argument.

It is also augmented by QEWD with some additional properties which are for internal use by QEWD and which should be left unchanged.

#### jwt

This is the updated JWT returned from your API handler.

You can easily access values within the JWT using the built-in QEWD function:

      this.jwt.handlers.getProperty(propertyName, jwt)

where *propertyName* is the name of a property (or claim) within the JWT.  For example:

      var username = this.jwt.handlers.getProperty('username', jwt);


#### forward

This is the function that you should use for forwarding an API request.  It is invoked like this:

      forward(apiRequest, jwt, callback)

The arguments are:

- **apiRequest**: an object that defines an API request, eg:

      *var apiRequest = {
        path: '/api/info/demographics',
        method: 'GET'
      };*

- **jwt**: the *jwt* argument as described above

- **callback**: Callback function with a single argument - *responseObj* - containing the response object from the API


#### sendBack

This is the function that you should use to return your final response back to the *Orchestrator* (or other MicroService if it sent the request).

It has a single argument: the object you wish to return.


### Example onMSResponse Module

This intercepts the response from the */api/login* handler and fetches demographics information before returning a combined response back to the *Orchestrator*

      module.exports = function(message, jwt, forward, sendBack) {
        var apiRequest = {
          path: '/api/info/demographics',
          method: 'GET'
        };
        forward(apiRequest, jwt, function(responseObj) {
          sendBack({
            login: message,
            demographics: responseObj
          });
        });
      };




**Note**: If your *onMSResponse* function returns *false*, the original response object from your API handler will be returned to the *Orchestrator*.  You can use this to conditionalise your *onMSResponse* logic, for example:


      module.exports = function(message, jwt, forward, sendBack) {

        if (message.item === 'bypass') {
          return false; //  Just let QEWD return the original response from your handler
        }

        var apiRequest = {
          path: '/api/info/demographics',
          method: 'GET'
        };
        forward(apiRequest, jwt, function(responseObj) {
          sendBack({
            login: message,
            demographics: responseObj
          });
        });
      };



## onOrchResponse


### Filename and Directory location

The filename is **onOrchResponse.js**.  Its name is case-sensitive.

The *onOrchResponse* hook is only relevant to MicroService applications

It is applied to the specified API, and is invoked on the QEWD Master process of the *Orchestrator* MicroService, on receipt of the response from the MicroService that handled the API.

Note: the *onOrchResponse* hook is invoked before the *onWSResponse* hook (if defined).

The *onOrchResponse* hook allows you to intercept the response from your API's handling MicroService, and send one or more further API requests, eg to other MicroServices, in order to build up a complex, composite response.

The *onOrchResponse* hook is therefore similar to the *onMSResponse* hook, but the *onOrchResponse* hook is invoked on the *Orchestrator*, whilst the *onMSResponse* hook is available on the other MicroServices that make up your application.  Which you use will depend on how and where you want to construct the results of complex chains of APIs.


An *onOrchResponse* module is placed is along-side the API handler module, eg: for the API defined in **routes.json**:

  {
    "uri": "/api/login",
    "method": "POST",
    "handler": "login",
    "on_microservice": "login_service",
    "authenticate": false
  }


You would define an *onOrchResponse* hook by adding the *onOrchResponse.js* module file here:


        ~/microserviceExample
            |
            |— configuration
            |
            |— login_service
            |         |
            |        login
            |           |
            |           |— index.js
            |           |
            |           |— onOrchResponse.js



### Module structure

Your *onOrchResponse.js* file should export a function of the structure shown below:

      module.exports = function(responseObj, request, forwardToMS, sendResponse, getJWTproperty) {
        // onOrchRequest logic here
      };


### Module Function Context

The *onOrchResponse* module's **this** object is the QEWD Master Process object for the MicroService.


### Module Function Arguments

#### responseObj

This is the object containing the response that has been received by the Orchestrator's Master process from another MicroService (or chain of MicroServices).

**Note**: if an error has occurred, then *responseObj.message.error* will exist and contain a string value.

#### request

This is the object containing the original request that was received by the Orchestrator.  It is made available because it may contain information that is useful for your hook's logic, eg *request.method* and *request.path* are the original incoming request's method and path respectively. 

#### forwardToMS

This is a function that you can use to forward a new request to a MicroService, rather than, or before returning the response to the REST Client.

It takes two arguments:

- **routeObj**: an object that defines the API route that you want to invoke, in terms of its path and method.  It can also include a *query* or *body* property (each of which is a sub-object);
- **callback**: a function with a single argument - the response object from the MicroService that processed your API route information.

For example:

      var msg = {
        path: '/api/info/info',
        method: 'GET'
      };
      forwardToMS(msg, function(responseObj) {
        // handle response
      });


#### sendResponse

This is a function that you should use to return your final response object back to the REST Client.

It has a single argument:

- **responseObj**: The object containing the response that you want to return to the REST Client

For example:

      var msg = {
        path: '/api/info/info',
        method: 'GET'
      };
      forwardToMS(msg, function(responseObj) {
        sendResponse(responseObj);
      });
      return true;


Alternatively, your *onWSResponse* hook module may simply be used to re-package / re-format the response before sending it to the REST Client, eg:

    if (!responseObj.message.error) {
      var respObj = {
        yousent: request.path,
        usingMethod: request.method,
        exp: getJWTProperty('exp')
      };
      sendResponse(respObj);
      return true;
    }

**Note**: If you use the *sendResponse* function, your *onWSResponse* hook module **MUST** return *true*, as shown in the examples above.  This tells QEWD that you are taking responsibility for returning the REST Client's response, and therefore QEWD doesn't try to also send a response.


#### getJWTProperty

This function allows you to extract a claim/property from the JWT.

It has a single argument: the name of the JWT claim or property.

See the example above, which gets the value of the *exp* property from the JWT.


### Example onWSResponse Module


      module.exports = function(responseObj, request, forwardToMS, sendResponse, getJWTProperty) {
        if (!responseObj.message.error) {
          var msg = {
            path: '/api/info/info',
            method: 'GET'
          };
          forwardToMS(msg, function(responseObj) {
            sendResponse(responseObj);
          });
          return true;
        }
        // otherwise the original error message will be sent to the REST Client
      };



## onWSResponse

### Filename and Directory location

The filename is **onWSResponse.js**.  Its name is case-sensitive.

The *onWSResponse* hook is only relevant to:

- a QEWD-Up Monolithic application;
- the Orchestrator MicroService in a QEWD-Up MicroService application

Its placement depends on what mode you are using and/or microservice you are specifying it for

#### Monolith

        ~/dockerExample
            |
            |— onWSResponse.js
            |
            |— configuration
            |
            |— apis
            |

The *onWSResponse* hook is applied to *ALL* responses received by the Master process.


#### MicroService: Orchestrator

        ~/microserviceExample
            |
            |— configuration
            |
            |— orchestrator
            |         |
            |         |— onWSResponse.js


The *onWSResponse* hook is applied to *ALL* responses received by the Orchestrator's Master process.


### Module structure

Your *onWSResponse.js* file should export a function of the structure shown below:

      module.exports = function(req, res, next) {
        // perform onWSResponse processing
        next();
      };

### Module Function Arguments

#### req

The WebServer (eg Express by default) request object

#### res

The WebServer (eg Express by default) response object

#### next

The WebServer (eg Express by default) next() function, allowing control to be passed to the next function in the middleware chain.

### Example

The following example does not, in fact, modify the response, but simply demonstrates how to implement a *pass-through* module that handles both success and error responses.

**Notes**: 

- the response object can be found in *res.locals.message*;
- the original incoming API route path can be found in *req.originalUrl*: use this if you want the logic to be conditional for specific API routes.


      module.exports = function(req, res, next) {
        var messageObj = res.locals.message || {error: 'Not Found'};
        if (messageObj.error) {
          var code = 400;
          var status = messageObj.status;
          if (status && status.code) code = status.code;
          delete messageObj.status;
          delete messageObj.restMessage;
          delete messageObj.ewd_application;
          res.set('content-length', messageObj.length);
          res.status(code).send(messageObj);
        }
        else {
          res.send(messageObj);
        }
        next();
      };




