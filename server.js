const koaStatic = require('koa-static');
const Koa = require('koa');
const koaws = require('koa-ws');
const app = new Koa();

app.use(koaws(app, {
  serveClientFile: true,
  clientFilePath: '/koaws.js',
  heartbeat: true,
  heartbeatInterval: 1000
}));
app.use(koaStatic('client'));

app.listen(8099);