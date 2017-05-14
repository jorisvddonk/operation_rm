import _ from 'lodash';
const PIXI = require('pixi.js');

export default class Parallaxlayer extends PIXI.Container {
  constructor(options) {
    super();
    this.texture = PIXI.Texture.fromImage(options.assetLocation);
    this.rendererWidth;
    this.rendererHeight;
    this.depthMultiplier = 1 / options.depth || 1;    
    this.texture.on('update', () => {
      this.updateTexture();
    });
  }

  updateTexture() {
    if (this.texture.width !== 1 && this.rendererWidth && this.rendererHeight) {
      // create textures
      var numHorizontal = Math.max(1, Math.ceil(this.rendererWidth / this.texture.width))+2;
      var numVertical = Math.max(1, Math.ceil(this.rendererHeight / this.texture.height))+2;
      _.each(_.range(0, numHorizontal), (x) => {
        _.each(_.range(0, numVertical), (y) => {
          var sprite = new PIXI.Sprite(this.texture);
          sprite.parallax = {
            x: x,
            y: y
          }
          sprite.position.x = (x-1) * this.texture.width;
          sprite.position.y = (y-1) * this.texture.height;
          this.addChild(sprite);
        });
      });
    }
  }

  wire(app) {
    this.rendererWidth = app.renderer.width;
    this.rendererHeight = app.renderer.height;
    app.ticker.add((delta) => {
      // sync to center of screen
      this.position.x = app.stage.pivot.x;
      this.position.y = app.stage.pivot.y;
      
      // set offset
      this.pivot.x = (app.stage.pivot.x*this.depthMultiplier % this.texture.width) + (this.width*0.5 - this.texture.width*0.5);
      this.pivot.y = (app.stage.pivot.y*this.depthMultiplier % this.texture.height) + (this.height*0.5 - this.texture.height*0.5);
      while (this.pivot.x > this.texture.width) {
        this.pivot.x -= this.texture.width;
      }
      while (this.pivot.y > this.texture.height) {
        this.pivot.y -= this.texture.height;
      }
    });
    this.updateTexture();
  }
  
};
