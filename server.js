var _ = require('lodash');
var fileType = require('file-type');
var readChunk = require('read-chunk');
const koaStatic = require('koa-static');
const Koa = require('koa');
var Router = require('koa-router');
var app = new Koa();
var router = new Router();
var stream = require('stream');

var path = require('path');
var fs = require('fs');
var ffmpeg = require('fluent-ffmpeg');

router.get('/data/:subpath*', function (ctx, next) {
  return new Promise(function(resolve, reject) {
    var pth = path.join(path.join(__dirname, '.'), ctx.params.subpath);
    try {
      var stats = fs.lstatSync(pth);
    } catch (e) {
      resolve();
    }
    if (stats.isDirectory()) {
      var details = fs.readdirSync(pth);
      details = _.map(details, function(filename) {
        var filepath = path.join(pth, filename);
        var filetype = fileType(readChunk.sync(filepath, 0, 100));
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
          name: filename,
          type: filetype
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
        ctx.body = fs.createReadStream(pth);
        ctx.contentType = filetype.mime;
        resolve();
      }
    }
  });
});

app.use(koaStatic('client'));
app.use(router.routes());
app.use(router.allowedMethods());
app.listen(8099);