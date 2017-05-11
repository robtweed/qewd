v3.0.5  May 5th 2017

# QEWD NOW SUPPORTS KOA.JS AND UWEBSOCKETS

Until now, QEWD has made use of Express and socket.io to provide its outward-facing HTTP(S) and WebSockets interface.

A recent benchmark test came to my attention, which highlighted the fact that the performance of these two dependent technologies is not exactly leading-edge.

One of the alternatives to Express that performed very well in the benchmark – Koa.js – is particularly interesting.  It’s being developed by the people behind Express and makes use of the very latest Node.js Async/Await capabilities (which means it currently requires Node.js v7.x to run).  It therefore probably represents the next generation of Web Server for Node.js.

Also highlighted in the benchmark is the performance of a WebSocket library known as uWebSockets.    It turns out that the very latest builds of socket.io can make use of this as its underlying engine, potentially improving socket.io‘s performance (although I haven’t yet seen any performance comparisons).

So, I decided to make these available as options for QEWD.  It’s very simple to try them out.  If you want to use Koa.js with QEWD, you’ll need to be using Node.js v7.x or later.  To use uWebSockets with socket.io, you’ll need to be using a recent version of socket.io (2.0.1 or later)

All you need to do  is add the following properties to the config object in your QEWD startup file:

```
webServer: ‘koa’
webSockets: {engine: ‘uws’}
```

For example:

```javascript
var config = {
  managementPassword: 'changeThis!',
  serverName: 'QEWD Conduit Server',
  port: 3000,
  poolSize: 2,
  database: {
    type: 'redis'
  },
  cors: true,
  webServer: 'koa',
  webSockets: {
    module: 'socket.io',
    engine: 'uws'
  }
};

var routes = [
  {
    path: '/api',
    module: 'qewd-conduit',
    errors: {
      notfound: {
        text: 'Resource Not Recognised',
        statusCode: 404
      }
    }
  }
];

var qewd = require('qewd').master;
var q = qewd.start(config, routes);

```

Then just start up QEWD and you’ll be using these very latest technologies.  No other changes are needed to your QEWD application logic, and any existing applications will work identically with Express and Koa.js.

One thing to notice when using QEWD with Koa.js for REST-based applications: take a look at the HTTP Response Headers (eg using your browser’s JavaScript console).  Look for the header:

X-ResponseTime:
This will tell you how long it took QEWD to process the request, ie:

putting the request on the queue
dispatching it to an available worker process
processing it in the worker process (including any database access)
returning the response back to the master process, ready for dispatch by Koa.js to the client that sent the request.
It won’t include any network latency time, so it helps to give a good idea of the speed of QEWD’s internals.

For example, I’ve set up a working demonstration, running the RealWorld Conduit application on an Amazon EC2 Ubuntu 16.04 machine (t2.micro).

It’s using QEWD together with the InterSystems Cache database, configured to use Koa.js. Give that live demo site a try and take a look at some of the X-ResponseTime headers: you’re going to see some very low numbers!

Note that no changes were needed to the back-end qewd-conduit application to make it work with Koa.js!  Indeed, because of this, it’s the first back-end for the RealWorld Conduit application that can make use of Koa.js.

One more example of the unique flexibility of QEWD!
