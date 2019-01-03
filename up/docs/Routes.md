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


