const _ = require('lodash');
const fileType = require('file-type');
const readChunk = require('read-chunk');
const koaStatic = require('koa-static');
const Koa = require('koa');
const http = require('http');
const Router = require('koa-router');
const app = new Koa();
const router = new Router();
const stream = require('stream');
const path = require('path');
const os = require('os');
const fs = require('fs');
const ffmpeg = require('fluent-ffmpeg');
const lwip = require('lwip');

router.get('/data/:subpath*', function (ctx, next) {
  return new Promise(function(resolve, reject) {
    if (!ctx.params.subpath) {
      ctx.params.subpath = '';
    }
    var pth = path.join(path.join(__dirname, '.'), ctx.params.subpath);
    try {
      var stats = fs.lstatSync(pth);
    } catch (e) {
      resolve();
    }
    if (stats.isDirectory()) {
      var details = fs.readdirSync(pth);
      details = _.map(details, function(entry_name) {
        var entry_path = path.join(pth, entry_name);
        if (fs.lstatSync(entry_path).isFile()) {
          var filetype = fileType(readChunk.sync(entry_path, 0, 100));
          if (filetype !== null) {
            if (filetype.mime.startsWith('video')) {
              filetype = 'video';
            } else if (filetype.mime.startsWith('image')) {
              filetype = 'image';
            } else {
              filetype = filetype.mime;
            }
          }
          return {
            name: entry_name,
            type: filetype
          }
        } else {
          return {
            name: entry_name,
            type: 'folder'
          }
        }
      });
      ctx.body = JSON.stringify(details);
      ctx.contentType = "application/json";
      resolve();
    } else if (stats.isFile()) {
      var filetype = fileType(readChunk.sync(pth, 0, 100));
      if (filetype !== null && filetype.mime.startsWith('video')) {
        ctx.body = stream.PassThrough();
        var command = ffmpeg(pth).noAudio().size('50x?').videoFilters('setpts=0.1*PTS').fps(10).format('ogv').output(ctx.body);
        ctx.contentType = "video/ogg";
        command.on('end', function() {
          console.log("Done converting video.");
        })
        command.on('progress', function(progress) {
          console.log('Processing: ' + progress.percent + '% done');
        });
        command.on('error', function(err) {
          console.error(err);
        });
        command.run();
        resolve();
      } else if (filetype !== null && filetype.mime.startsWith('image')) {
        ctx.contentType = filetype.mime;
        try {
          lwip.open(pth, function(err, image) {
            if (!err) {
              image.batch().cover(54, 54).toBuffer('jpg', {}, function(err, buf){
                if (!err) {
                  ctx.body = buf;
                } else {
                  ctx.body = fs.createReadStream(pth);
                }
                resolve();
              })
            } else {
              ctx.body = fs.createReadStream(pth);
              resolve();
            }
          });
        } catch (e) {
          ctx.body = fs.createReadStream(pth);
          resolve();
        }
      }
    }
  });
});

app.use(koaStatic('client'));
app.use(router.routes());
app.use(router.allowedMethods());

const server = http.createServer(app.callback());
const io = require('socket.io')(server);
io.on('connection', function(client){
  console.log("Received socketIO connection...")
  client.join('players');
  client.on('message', function(x){
    console.log("MSG", x)
  })
  client.emit('hostname', os.hostname());

  setTimeout(function(){
    io.to('players').send('Test!');
  }, 1000);
});
setInterval(function(){
  io.to('players').emit('loadavg', os.loadavg()).emit('freemem', os.freemem());
}, 1000);

var startServer = function() {
  console.log("Starting server...");
  server.listen(8099, function() {
    console.log("Server listening on port 8099...");
  })
};
startServer();
