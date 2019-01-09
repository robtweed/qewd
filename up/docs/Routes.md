# Contents

- [Defining Routes in QEWD-Up](#defining-routes-in-qewd-up)
- [Route Definitions](#route-definitions)
  - [Monolithic Applications](#monolithic-applications)
  - [MicroService Applications](#microservice-applications)
    - [APIs Handled on a Single MicroService](#apis-handled-on-a-single-microservice)
    - [APIs Handled on Multiple MicroServices](#apis-handled-on-multiple-microservices)
  - [Internal MicroService APIs](#internal-microservice-apis)
- [Over-rides](#over-rides)
  - [The beforeHandler Hook in Monolithic Applications](#the-beforehandler-hook-in-monolithic-applications)
  - [Authenticated JWTs in MicroService Applications](#authenticated-jwts-in-microservice-applications)
- [Customising Invalid Route Error Responses](#customising-invalid-route-error-responses)
- [Variable API Paths](#variable-api-paths)
- [Variable MicroService Destinations](#variable-microservice-destinations)
- [Federated Data Using Group Destinations](#federated-data-using-group-destinations)
- [Dynamically Routed APIs](#dynamically-routed-apis)

# Defining Routes in QEWD-Up

Routes are defined in the */configuration/routes.json* file as an array of route objects.

These Route definitions are used:

- by each QEWD-Up instance when you first start it up
- by each QEWD Worker process when it is first started by its Master process

If you modify the Route definitions in any way, you must restart:

- the QEWD-Up instance if you are running a monolithic application;
- the Orchestrator QEWD-Up instance and any QEWD-Up MicroService instances that handle the modified routes.

# Route Definitions

## Monolithic Applications

For monolithic applications, most routes can be described by an object containing three properties:

- **uri**: the API path
- **method**: the HTTP method (GET by default)
- **handler**: the name of your handler module that will perform the processing of the request

For example:

      [
        {
          "uri": "/api/orchestrator/info",
          "method": "GET",
          "handler": "getInfo"
        }
      ]

## MicroService Applications

For Micro-Service applications, most route definitions require the same three properties:

- **uri**: the API path
- **method**: the HTTP method (GET by default)
- **handler**: the name of your handler module that will perform the processing of the request


If the API is to be hancled on the Orchestrator, these three properties are sufficient.

However, if the API is to be handled on a MicroService, you must also specify the name of the MicroService(s) on which the API's *handler* module will run.

### APIs Handled on a Single MicroService

If the API is to be handled on just one MicroService, you add the property:

- **on_microservice**: the name of the MicroService on which the *handler* module will run

MicroService names (and their physical configurations) are defined in the */configuration/config.json* file.

For example:

      [
        {
          "uri": "/api/info/info",
          "method": "GET",
          "handler": "getInfo",
          "on_microservice": "info_service" 
        }
      ]


### APIs Handled on Multiple MicroServices

If the API is to be handled on more than one MicroService, you add the property:

- **on_microservices**: an array of MicroService names on which the *handler* module will run

MicroService names (and their physical configurations) are defined in the */configuration/config.json* file.

You only need to define the *handler* module logic once within the relevant API folder for just one of the MicroServices and add the route property

- **handler_source**: the name of the MicroService in which you've defined the *handler* module logic.

For example:

      [
        {
           "uri": "/api/:destination/getStock",
          "method": "GET",
          "handler": "getStock",
          "on_microservices": [
            "info_service",
            "login_service"
          ],
          "handler_source": "info_service" 
        }
      ]


## *Internal* MicroService APIs

You can use the [*onMSResponse*](https://github.com/robtweed/qewd/blob/master/up/docs/Life_Cycle_Events.md#onmsresponse) Event Hook to chain MicroService APIs - ie a MicroService can forward one or more API requests that will be handled on other MicroServices.  You may not want these APIs to be publicly accessible via the Orchestrator, but instead be *internally* accessible only.

QEWD-Up therefore allows you to define routes that are only accessible from one or more MicroServices.  Simply add the *route* property:

- **from_microservices**: array of MicroService names that are allowed to invoke requests for the API.

For example:


      {
        "uri": "/api/info/demographics",
        "method": "GET",
        "handler": "getDemographics",
        "on_microservice": "info_service",
        "from_microservices": [
          "login_service"
        ]
      }

In the above example, the */api/info/demographics* API (which runs on the *info_service* MicroService) can only be accessed from the *login_service* MicroService.



# Over-rides

You can over-ride a number of otherwise automatically-applied steps that are handled by QEWD.

## The *beforeHandler* Hook in Monolithic Applications

In Monolithic applications, you can apply a *beforeHandler* hook that is invoked in the QEWD Worker process just before your *handler* module is invoked.  A *beforeHandler* hook is a handy way of applying tests to all of your APIs, for example to ensure that the user who is sending the API request has been authenticated.

In the case of a *beforeHandler* hook that tests for user authentication (eg checking the value of the *Authorization* header for a valid QEWD Session token), you'll probably **NOT** want to apply its logic to the API with which the user first authenticates themselves.  Hence you'll need to over-ride the *beforeHandler* hook for this API.

To over-ride the *beforeHandler* hook, simply add the *route* property:

- **applyBeforeHandler**: *false*

For example:


      [
        {
          "uri": "/api/login",
          "method": "POST",
          "handler": "login",
          "applyBeforeHandler": false
        },
        {
          "uri": "/api/info",
          "method": "GET",
          "handler": "getInfo"
        }
      ]


So in the example above, your authentication tests in the *beforeHandler* hook will be applied to the */api/info* route, but **not** to the */api/login* route.


## Authenticated JWTs in MicroService Applications

In MicroService applications, QEWD-Up will check incoming requests on the Orchestrator to ensure that they include a valid, un-expired JWT in the *Authorization* header, **AND** that the *authenticated* property within the JWT is set to *true*.

Of course, you'll need to over-ride these tests in at least one of your APIs: the one(s) used to authenticate the user.  You over-ride this JWT test by adding the *route* property:

- **authenticate**: *false*

For example:

      [
        {
          "uri": "/api/login",
          "method": "POST",
          "handler": "login",
          "on_microservice": "login_service",
          "authenticate": false
        },
        {
          "uri": "/api/info/info",
          "method": "GET",
          "handler": "getInfo",
          "on_microservice": "info_service" 
        }
      ]

In the example above, the JWT is **not** tested for incoming */api/login* requests, meaning that such requests do not need to include an *Authorization* header at all.  However, a valid, authenticated JWT must be present in the */api/info/info* request's *Authorization* header.

The handler for the *login* API on the *login_service* MicroService will set the JWT's *authenticated* property if the user's login credentials are satisfactory.  For example:

      module.exports = function(args, finished) {
        var username = args.req.body.username;
        var password = args.req.body.password;
        var jwt = args.session;
        if (username === 'rob' && password === 'secret') {
          jwt.authenticated = true; // *** Sets the JWT's authenticated property ***
          jwt.timeout = 1200;
          finished({
            ok: true
          });
        }
        else {
          finished({error: 'Invalid login'});
        }
      };

In the example above, if valid username/password credentials are added to the *POST* request's *body* payload, then the response willl include an authenticated JWT in the response, eg:

      {
      "ok":true,
       "token":"eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJleHAiOjE1NDY1MDk5MjQsImlhdCI6MTU0NjUwODcyNCwiaXNzIjoicWV3ZC5qd3QiLCJhcHBsaWNhdGlvbiI6ImxvZ2luX3NlcnZpY2UiLCJ0aW1lb3V0IjoxMjAwLCJxZXdkIjoiNzA0ZDg1YTJhZGM2OWI4ODI0NjJiN2RiMThlNGE1Y2M4MjEwMjAzMTJhY2RmNDkxNmZkM2ZhY2IwMWFlMWEyODUzN2Y4ZDQ2MWYzMjQyNThjYmIyNjhkMTQ4ODgzNjY2MjRmYmU1YmFkNTUzYjMwNmI0ODkwMjg0MDRkZjNjZjZlYzkzMjMyYThiNDgwYmQzZmY4OGZlMWZkNTIzYjUwZDk3OGFiYjViNjdlZTZkYWRlNzlkYzI4Y2I0MWQzOTQ4In0.wIhiIJzttrmFNcQUn04FGOO29tPi2yz3grXs63Yiivw"
      }

**Note**: if you decode this JWT, don't be surprised that you don't actually see a visible *authenticated* property - QEWD encrypts it and holds it within its *qewd* Claim, eg:


      {
        "exp": 1546509924,
        "iat": 1546508724,
        "iss": "qewd.jwt",
        "application": "login_service",
        "timeout": 1200,
       "qewd": "704d85a2adc69b882462b7db18e4a5cc821020312acdf4916fd3facb01ae1a28537f8d461f324258cbb268d14888366624fbe5bad553b306b489028404df3cf6ec93232a8b480bd3ff88fe1fd523b50d978abb5b67ee6dade79dc28cb41d3948"
      }

However, the *authenticated* property value is automatically decrypted by QEWD and made available to your API handler modules (along with any other encrypted values within the *qewd* Claim).


In the example above, if invalid user credentials had been supplied, then the API response would be an Error response without a JWT.


# Customising Invalid Route Error Responses

QEWD automatically returns a default Error response if requests are submitted for API routes that are not defined in the *routes.json* file.  By default an HTTP response with a Status of *400* will be returned, and it will include a JSON response payload as follows:

      {
        "error":"No handler defined for api messages of type {{xxx}}"
      }

The *type* in the error response will actually correspond to the 2nd part of the API path.

You can take control over the error responses returned for invalid API requests.  Simply add an **else** object to the end of your *routes* array, defining the HTTP status code and error text you want to return.

For example:

      [
        {
          "uri": "/api/login",
          "method": "POST",
          "handler": "login",
          "on_microservice": "login_service",
          "authenticate": false
        },
        {
          "uri": "/api/info/info",
          "method": "GET",
          "handler": "getInfo",
          "on_microservice": "info_service" 
        },
        {
          "else": {
            "statusCode": 404,
            "text": "Not Found"
          }
        }
      ]

Now, any API request other than *POST /api/login* or *GET /api/info/info* will return a *404* error and a JSON error response payload:

      {
        "error": "Not Found"
      }



# Variable API Paths

Your API route paths can contain one or more variable components.  These are simply specified with a preceding colon. For example:

      "uri": "/api/patient/:patientId"

      "uri": "/api/patient/:patientId/heading/:heading"



In the first example above, the third part of the API route will be mapped automatically by QEWD to a variable named *patientId*.

In the second example above, the third part of the API route will be mapped automatically by QEWD to a variable named *patientId*, and the fifth part of the API route will be mapped to a variable named *heading*.

These variables are available to you in your handler module as *args[variableName]*.

For example, if your route definition is:

    {
      "uri": "/api/patient/:patientId/heading/:heading",
      "method": "GET",
      "handler": "getPatientHeading",
      "on_microservice": "clinical_data_service" 
    }

Then, in your *getPatientHeading* handler module, you can access the variables *patientId* and *heading* like this:


      module.exports = function(args, finished) {
        var patientId = args.patientId;
        var heading = args.heading;

        //.... etc

      };

So, if the user sent the request: *GET /api/patient/1234567/heading/allergies*:

      args.patientId = "1234567"
      args.heading = "allergies"


# Variable MicroService Destinations

The API path variable name *destination* is a reserved name.  If specified in an API path, QEWD will attempt to route the request to a MicroService with that name.  If the *destination* value does not match a configured MicroService name, then QEWD will return an appropriate error response.


For example:

    {
      "uri": "/api/store/:destination/stockLevels",
      "method": "GET",
      "handler": "getStockLevels",
      "on_microservices: [
        "london_store",
        "leeds_store",
        "edinburgh_store"
      ],
      "handler_source": "london_store" 
    }

This can be used to get stock level information from three MicroServices named *london_store*, *leeds_store* and *edinburgh_store*.  The *getStockLevels* handler module definition is speficied once only and can be found in the handlers folder for the *london_store* MicroService.

So, for example, a user wanting the stock level information for the Leeds store would send the request:

      GET /api/store/leeds_store/stockLevels


# Federated Data Using Group Destinations

In the above example, if we wanted to find out stock levels at all three stores, we'd need to send three separate requests, one for each store MicroService destination.

However, QEWD provides a way of combining MicroServices into a named *Group Destination*.  By sending a request for an API that uses such a Group Destination, the Orchestrator automatically sends simultaneous asynchronous requests to all the MicroServices that make up the Group, and returns a composite response once it receives the responses from all the MicroServices in the Group.

If any of the MicroServices in the Group return an error, that error will be included in the composite response.

This mechanism can be used for automatic federation of data across distributed systems.

## Creating a Group Destination

Group destinations are defined in the */configuration/config.json* file.

First, define the individual MicroServices as normal in the *config.json* file, eg:

      {
        "qewd_up": true,
        "microservices": [
          {
            "name": "london_store",
            "qewd": {
              "serverName": "London Store"
            }
          },
          {
            "name": "leeds_store",
            "qewd": {
              "serverName": "Leeds Store"
            }
          },
          {
            "name": "edinburgh_store",
            "qewd": {
              "serverName": "Edinburgh Store"
            }
          }
        ]
      }


Then add a Group destination - we'll call it *all_stores* in this example, but its name is up to you.  Define the MicroServices that are included in the Group using the *members* array, for example:

      {
        "qewd_up": true,
        "microservices": [
          {
            "name": "london_store",
            "qewd": {
              "serverName": "London Store"
            }
          },
          {
            "name": "leeds_store",
            "qewd": {
              "serverName": "Leeds Store"
            }
          },
          {
            "name": "edinburgh_store",
            "qewd": {
              "serverName": "Edinburgh Store"
            }
          },
          {
            "name": "all_stores",
            "members": [
              "london_store",
              "leeds_store",
              "edinburgh_store"
             ]
          }
        ]
      }


## Create a Route that Uses the Group Destination

Now, in our *routes.json* file we can define a new route for getting the stock levels for all stores:

      {
        "uri": "/api/all/stockLevels",
        "method": "GET",
        "handler": "getStockLevels",
        "on_microservice": "all_stores",
        "handler_source": "london_store"
      }


## Try it Out

If you now send a *GET /api/all/stockLevels* request, you should get back a composite result.  These are returned in an object named *results*.  Each store MicroService will return its results (as returned from the *getStockLevels* handler module) in a sub-object whose name is the MicroService name, eg:

      {
        "results":{
          "london_store":{
            "product":"Widgets",
            "quantity":34
          },
          "leeds_store":{
            "product":"Widgets",
            "quantity":35
          },
          "edinburgh_store":{
            "product":"Widgets",
            "quantity":21
          }
        },
        "token": "eyJ0eXA..."
     }

The *token* property is always returned with non-Error responses, and is the updated JWT.

**Note 1*: Although the example uses a GET method, you can also use POST, PUT and DELETE to create or modify information in all MicroServices within a Group Destination.

**Note 2*: You can even use a Group Destination name in an API route that has a variable destination.


# Dynamically Routed APIs

QEWD-Up is not limited to API routing that is explicitly defined within the *routes.json* route properties.

Sometimes, you need an API whose routing needs to be determined at run-time on the basis of some aspect of its content and/or structure/format.  QEWD-Up's Dynamic Routing provides you with the mechanism for doing this.

## Defining a Dynamically-Routed API

A Dynamically-Routed API is specified using the standard *uri* and *method* properties and a third property:

- **router**: The name of a module that you write, whose purpose is to define how to handle it.  The module name is up to you.

For example:

      {
        "uri": "/api/dynamicallyRouted",
        "method": "GET",
        "router": "myCustomRouter"
      }

## Defining a Router Module

In the example above, we're specifying that the routing for a *GET /api/dynamicallyRouted* request will be the responsibility of a module named *myCustomRouter*

This module is created in the *orchestrator* folder, in a sub-folder named *routers*, eg:

        ~/microserviceExample
            |
            |_ configuration
            |
            |_ orchestrator
            |       |
            |      routers
            |       |
            |       |_ myCustomRouter.js



## Router Module structure

Your Router Module file should export a function of the structure shown below:

      module.exports = function(args, send, handleResponse) {
        // Router logic here
      };


## Router Module Arguments

### args

This object contains the incoming request as restructured by QEWD's Master process.  Most of the information you'll need for your routing logic is in *args.req*.  eg:

- **args.req.headers**: The HTTP request headers
- **args.req.query**: The parsed name/value pairs in the URL query string (if any)
- **args.req.body**: The parsed JSON body payload

### handleResponse

Use this function to return the response to the REST Client. It is your responsibility to return the response if you are using a Router module.

It has a single argument: the object containing your response.  Note: the response **MUST* be included in a property named *message*. 

### send

This is a function you can use to forward an API request.  To use it you must first create an object that contains the path and method (and optionally any payload) of an API route that you want to invoke.  

**Note**: This API route must be defined within your *routes.json* file.

The *send()* function takes two further arguments:

- args: as provided by the router module interface
- handleResponse: as described above

## Router Module Example

      module.exports = function(args, send, handleResponse) {
        if (args.req.query.bypass) {
          handleResponse({
            message: {
              login: 'bypassed'
            }
          });
        }
        else {
          var message = {
            path: '/api/info/info',
            method: 'GET'
          };
          send(message, args, handleResponse);
        }
      };

In the example above:

- sending *GET /api/dynamicallyRouted?bypass=true will return a response of {login: 'bypassed'}

- sending *GET /api/dynamicallyRouted* will forward a request for the *GET /api/info/info* API (which must be defined in the *routes.json* file.  Its response is returned via the *send()* function's *handleResponse* argument.
 
