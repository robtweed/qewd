/*

 ----------------------------------------------------------------------------
 | qewd: Quick and Easy Web Development                                     |
 |                                                                          |
 | Copyright (c) 2017 M/Gateway Developments Ltd,                           |
 | Reigate, Surrey UK.                                                      |
 | All rights reserved.                                                     |
 |                                                                          |
 | http://www.mgateway.com                                                  |
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

  10 May 2017

*/


var koa = require('koa');
var app = new koa();
var Router = require('koa-better-router');
var koaRouter = Router().loadMethods();
var koaServe   = require('koa-static');
var koaBodyParser = require('koa-bodyparser');

var bodyParser;
var qx;

function qxHandleMessage(ctx) {
   console.log('!!!! params = ' + JSON.stringify(ctx.params));
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

function configure(config, routes, qExt) {

  qx = qExt;

  // if user instantiates his/her own bodyParser module, use it
  //  Note: user must then also define the app.use express middleware to use it
  if (config.bodyParser) {
    bodyParser = config.bodyParser;
  }
  else {
    bodyParser = koaBodyParser;
    app.use(bodyParser());
    //if (config.addMiddleware) config.addMiddleware(bodyParser, app, q, qx, config);
  }

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
    var route;
    routes.forEach(function(route) {
      //console.log('** route = ' + JSON.stringify(route));
      var path = route.path;

      //console.log('add route for path ' + path);
   
      var match = 'GET ' + route.path + '/:type';
      //console.log('match: ' + match);
      koaRouter.addRoute(match, async (ctx, next) => {
        //console.log('$$$ params = ' + JSON.stringify(ctx.params));
        await qxHandleMessage(ctx);
        await next();
      });
      match = 'GET ' + route.path + '/:type/*';
      //console.log('match: ' + match);
      koaRouter.addRoute(match, async (ctx, next) => {
        //console.log('GET !!!');
        await qxHandleMessage(ctx);
        await next();
      });
      match = 'POST ' + route.path + '/:type/*';
      //console.log('match: ' + match);
      koaRouter.addRoute(match, async (ctx, next) => {
        await qxHandleMessage(ctx);
        await next();
      });
      match = 'POST ' + route.path + '/:type';
      //console.log('match: ' + match);
      koaRouter.addRoute(match, async (ctx, next) => {
        await qxHandleMessage(ctx);
        await next();
      });
      match = 'DELETE ' + route.path + '/:type/*';
      //console.log('match: ' + match);
      koaRouter.addRoute(match, async (ctx, next) => {
        await qxHandleMessage(ctx);
        await next();
      });
      match = 'PUT ' + route.path + '/:type';
      //console.log('match: ' + match);
      koaRouter.addRoute(match, async (ctx, next) => {
        await qxHandleMessage(ctx);
        await next();
      });
      match = 'PUT ' + route.path + '/:type/*';
      //console.log('match: ' + match);
      koaRouter.addRoute(match, async (ctx, next) => {
        await qxHandleMessage(ctx);
        await next();
      });

    });
  }

  app.use(koaRouter.middleware());

  // **** if (userIntercept) app.use(demo);

  // End of middleware chain - display the body

  app.use(ctx => {
    //console.log('display!');
    ctx.body = ctx.state.responseObj;
  });

  return app;
}

module.exports = configure


