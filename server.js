const koaStatic = require('koa-static');
const Koa = require('koa');
const app = new Koa();

app.use(koaStatic('client'));

app.listen(8099);