import _ from 'lodash';
const PIXI = require('pixi.js');

export default function(options) {
  var container = new PIXI.Container();
  var texture = PIXI.Texture.fromImage(options.assetLocation);
  var rendererWidth;
  var rendererHeight;
  var depthMultiplier = 1 / options.depth || 1;
  
  var update = function() {
    if (texture.width !== 1 && rendererWidth && rendererHeight) {
      // create textures
      var numHorizontal = Math.max(1, Math.ceil(rendererWidth / texture.width))+2;
      var numVertical = Math.max(1, Math.ceil(rendererHeight / texture.height))+2;
      _.each(_.range(0, numHorizontal), function(x){
        _.each(_.range(0, numVertical), function(y){
          var sprite = new PIXI.Sprite(texture);
          sprite.parallax = {
            x: x,
            y: y
          }
          sprite.position.x = (x-1) * texture.width;
          sprite.position.y = (y-1) * texture.height;
          container.addChild(sprite);
        });
      });
    }
  }

  texture.on('update', update);
  
  container.wire = function(app) {
    rendererWidth = app.renderer.width;
    rendererHeight = app.renderer.height;
    app.ticker.add(function(delta) {
      // sync to center of screen
      container.position.x = app.stage.pivot.x;
      container.position.y = app.stage.pivot.y;
      
      // set offset
      container.pivot.x = (app.stage.pivot.x*depthMultiplier % texture.width) + (container.width*0.5 - texture.width*0.5);
      container.pivot.y = (app.stage.pivot.y*depthMultiplier % texture.height) + (container.height*0.5 - texture.height*0.5);
      while (container.pivot.x > texture.width) {
        container.pivot.x -= texture.width;
      }
      while (container.pivot.y > texture.height) {
        container.pivot.y -= texture.height;
      }
    });
    update();
  }
  return container;
};
