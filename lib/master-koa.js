/*

 ----------------------------------------------------------------------------
 | qewd: Quick and Easy Web Development                                     |
 |                                                                          |
 | Copyright (c) 2023 MGateway Ltd,                                         |
 | Banstead, Surrey UK.                                                     |
 | All rights reserved.                                                     |
 |                                                                          |
 | https://www.mgateway.com                                                 |
 | Email: rtweed@mgateway.com                                               |
 |                                                                          |
 |                                                                          |
 | Licensed under the Apache License, Version 2.0 (the "License");          |
 | you may not use this file except in compliance with the License.         |
 | You may obtain a copy of the License at                                  |
 |                                                                          |
 |     http://www.apache.org/licenses/LICENSE-2.0                           |
 |                                                                          |
 | Unless required by applicable law or agreed to in writing, software      |
 | distributed under the License is distributed on an "AS IS" BASIS,        |
 | WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. |
 | See the License for the specific language governing permissions and      |
 |  limitations under the License.                                          |
 ----------------------------------------------------------------------------

  5 September 2017

  Thanks to Ward DeBacker for modifications, in particular
  for the beforeRouter and afterRouter logic

*/


var koa = require('koa');
var app = new koa();
var Router = require('koa-better-router');
var koaRouter = Router().loadMethods();
var koaServe   = require('koa-static');
var koaBodyParser = require('koa-bodyparser');

var bodyParser;
var qx;
var q;

function qxHandleMessage(ctx) {
  //console.log('!!!! params = ' + JSON.stringify(ctx.params));
  ctx.state.params = ctx.params;
  return new Promise((resolve) => {
    qx.handleMessage(ctx, resolve);
  })
}

async function responseTime (ctx, next) {
  //console.log('in responseTime');
  const started = Date.now();
  await next();
  // once all middleware below completes, this continues
  const elapsed = (Date.now() - started) + 'ms';
  ctx.set('X-ResponseTime', elapsed);

  // if cors is set
  if (qx.cors) {
    ctx.set('Access-Control-Allow-Credentials', 'true');
    ctx.set('Access-Control-Allow-Headers', 'DNT,X-CustomHeader,Keep-Alive,User-Agent,X-Requested-With,If-Modified-Since,Cache-Control,Content-Type,Authorization');
    ctx.set('Access-Control-Allow-Methods', 'GET, PUT, DELETE, POST, OPTIONS');
    ctx.set('Access-Control-Allow-Origin', '*');
  }
}

function configure(config, routes, qOper8, qExt) {
  qx = qExt;
  q = qOper8;

  // if user instantiates his/her own bodyParser module, use it
  //  Note: user must then also define the app.use express middleware to use it

  if (config.bodyParser) {
    bodyParser = config.bodyParser;
  }
  else {
    bodyParser = koaBodyParser;
    app.use(bodyParser());
    // note: config.webServer will be 'koa'
  }

  // if user defines addMiddleware method, give them complete control!

  if (config.addMiddleware) config.addMiddleware(bodyParser, app, q, qx, config);

  app.use(responseTime);
  app.use(koaServe(config.webServerRootPath));

  koaRouter.addRoute('GET /ajax/*', async (ctx, next) => {
    await qxHandleMessage(ctx);
    await next();
  });
  koaRouter.addRoute('POST /ajax/*', async (ctx, next) => {
    await qxHandleMessage(ctx);
    await next();
  });

  if (config.cors) qx.cors = true;

  if (routes) {
    routes.forEach(function(route) {
      //console.log('** route = ' + JSON.stringify(route));
      var path = route.path;
      // create (variable) arguments array to pass to app.use()
      var args = [];

      // add array with custom middleware to add before qx.router is called (if present)

      if (route.beforeRouter && Array.isArray(route.beforeRouter)) args = args.concat(route.beforeRouter);

      var handler = async (ctx, next) => {
        //console.log('$$$ params = ' + JSON.stringify(ctx.params));
        await qxHandleMessage(ctx);
        await next();
      };

      if (route.afterRouter) {
        handler = async (ctx, next) => {
          //console.log('$$$ params = ' + JSON.stringify(ctx.params));
          ctx.state.nextCallback = true;
          //console.log('$$$ state = ' + JSON.stringify(ctx.state));
          await qxHandleMessage(ctx);
          await next();
        };
      }
      args = args.concat([
        handler
      ]);

      // add array with custom middleware to add after qx.router is called (if present)

      if (route.afterRouter && Array.isArray(route.afterRouter)) args = args.concat(route.afterRouter);

      // define the Express route by calling app.use()

      //console.log('add Koa route for path ' + path, args);

      var match;

      match = 'GET ' + path + '/:type';
      koaRouter.addRoute(match, args);

      match = 'GET ' + path + '/:type/*';
      koaRouter.addRoute(match, args);

      match = 'POST ' + path + '/:type/*';
      koaRouter.addRoute(match, args);

      match = 'POST ' + path + '/:type';
      koaRouter.addRoute(match, args);

      match = 'DELETE ' + path + '/:type/*';
      koaRouter.addRoute(match, args);

      match = 'PUT ' + path + '/:type';
      koaRouter.addRoute(match, args);

      match = 'PUT ' + path + '/:type/*';
      koaRouter.addRoute(match, args);

      match = 'PATCH ' + path + '/:type';
      koaRouter.addRoute(match, args);

      match = 'PATCH ' + path + '/:type/*';
      koaRouter.addRoute(match, args);
    });
  }

  app.use(koaRouter.middleware());

  // **** if (userIntercept) app.use(demo);

  // End of middleware chain - display the body
  app.use(ctx => {
    //console.log('display!');

    // only set body if there is a responseObj in ctx.state
    //  (to avoid overwriting error statuses from middleware)

    !ctx.state.nextCallback && ctx.state.responseObj && (ctx.body = ctx.state.responseObj);
  });
  return app;
}

module.exports = configure
