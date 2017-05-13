import _ from 'lodash';
import File from './File';
const PIXI = require('pixi.js');

export default class VideoFile extends File {
  constructor(options) {
    super(options);
    this.children[0].destroy(); // remove File image first..
    var video = new PIXI.Sprite(PIXI.Texture.fromVideoUrl(options.abspath));
    video.anchor.set(0.5);
    this.addChildAt(video, 0);
  }

  getHitboxSize() {
    return {width: 35, height: 20}
  }
}