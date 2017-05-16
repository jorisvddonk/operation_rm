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
const argv = require('yargs').argv;

// Set the GAME ROOT to the root Operation RM game directory or to a custom path specified by the user.
var GAME_ROOT = __dirname;
if (_.isString(argv.root)) {
  GAME_ROOT = argv.root;
}
GAME_ROOT = path.resolve(GAME_ROOT);
console.log("Game root is", GAME_ROOT);

// Game state:
var destroyedFiles = new Set();

/*
REST API; /data/* endpoint.
This endpoint either:
1) Returns data (filenames, filetypes) about folders
2) Transcodes and streams video files
3) Resizes and serves image files
*/
router.get('/data/:subpath*', function (ctx, next) {
  return new Promise(function(resolve, reject) {
    if (!ctx.params.subpath) {
      ctx.params.subpath = '';
    }
    var pth = path.join(path.join(GAME_ROOT, '.'), ctx.params.subpath);
    try {
      var stats = fs.lstatSync(pth);
    } catch (e) {
      resolve();
    }
    if (stats.isDirectory()) { // For folders: return folder content
      var contents = fs.readdirSync(pth);
      contents = _.compact(_.map(contents, function(entry_name) {
        try {
          var entry_path = path.join(pth, entry_name);
          if (fs.lstatSync(entry_path).isFile()) { // For files: determine the filetype and return these details about the file
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
              type: filetype,
              destroyed: destroyedFiles.has(path.relative(GAME_ROOT, entry_path).replace(/\\/gi, '/'))
            }
          } else { // For folders: just return details about the folder
            return {
              name: entry_name,
              type: 'folder',
              destroyed: false
            }
          }
        } catch (e) {
          return undefined; // if the resource is busy or locked, ignore it completely.
        }
      }));
      var absolute_path = path.resolve(pth);
      var details = {
        contents: contents,
        absolute_path: absolute_path,
        is_root: absolute_path === GAME_ROOT
      };
      ctx.body = JSON.stringify(details);
      ctx.contentType = "application/json";
      resolve();
    } else if (stats.isFile()) { // For files:
      var filetype = fileType(readChunk.sync(pth, 0, 100));
      if (filetype !== null && filetype.mime.startsWith('video')) { // Video files are transcoded and streamed
        ctx.body = stream.PassThrough();
        var command = ffmpeg(pth).noAudio().size('50x?').videoFilters('setpts=0.1*PTS').fps(10).format('ogv').output(ctx.body);
        ctx.contentType = "video/ogg";
        command.on('end', function() {
          console.log("Done converting video.");
        });
        command.on('progress', function(progress) {
          console.log('Processing: ' + progress.percent + '% done');
        });
        command.on('error', function(err) {
          console.error(err);
          ctx.status = 500;
          ctx.body = "";
        });
        command.run();
        resolve();
      } else if (filetype !== null && filetype.mime.startsWith('image')) { // Image files are resized and served
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

// Setup the Koa app
app.use(koaStatic('client')); // serve Client files
app.use(router.routes()); // Use REST API routes
app.use(router.allowedMethods());

// Setup Socket.IO server
const server = http.createServer(app.callback());
const io = require('socket.io')(server);
io.on('connection', function(client){
  console.log("Received socketIO connection...", client.id)
  client.join('players');
  client.on('identify', function(id) {
    client.identity = id;
  });
  client.on('destroyedFile', function(filepath){
    if (_.isString(filepath)) {
      destroyedFiles.add(filepath);
    }
  });
  client.emit('hostname', os.hostname()); // Whenever a Client connects, send them the hostname of the system.
  client.on('shipTick', function(x) {
    if (client.identity) {
      x.identity = client.identity;
      client.to('players').broadcast.emit('shipTick', x);
    } else {
      console.log("Ignored shipTick because no identity!");
    }
  });
  client.on('shipStateUpdate', function(x) {
    if (client.identity) {
      x.identity = client.identity;
      client.to('players').broadcast.emit('shipStateUpdate', x);
    } else {
      console.log("Ignored shipStateUpdate because no identity!");
    }
  });
});
setInterval(function(){ // Periodically send load average and free memory
  io.to('players').emit('loadavg', os.loadavg()).emit('freemem', os.freemem());
}, 1000);

// Actually initialize the server!
var startServer = function() {
  console.log("Starting server...");
  server.listen(8099, function() {
    console.log("Server listening on port 8099...");
  })
};
startServer();
