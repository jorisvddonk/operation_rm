import _ from 'lodash';
import File from './File';
const PIXI = require('pixi.js');

export default class ImageFile extends File {
  constructor(options) {
    super(options);
    this.children[0].destroy(); // remove File image first..
    var texture = PIXI.Texture.fromImage(options.resource_path);
    texture.baseTexture.on('error', function() {
      texture.baseTexture.updateSourceImage("assets/file_error.png");
    });
    this.image = new PIXI.Sprite();
    texture.on('update', () => {
      if (texture.width >= texture.height) {
        this.image.width = 50;
        this.image.height = (50 * texture.height) / texture.width;
      } else {
        this.image.width = (50 * texture.width) / texture.height;
        this.image.height = 50;
      }
      this.image.texture = texture;
    });
    this.image = new PIXI.Sprite(texture);
    this.image.anchor.set(0.5);
    this.addChildAt(this.image, 0);
  }

  getHitboxSize() {
    return {width: this.image.width - 20, height: this.image.height - 20}
  }
}
