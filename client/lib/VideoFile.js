import _ from 'lodash';
import File from './File';
const PIXI = require('pixi.js');

/*
Game object: a video file on the user's filesytem.
*/
export default class VideoFile extends File {
  constructor(options) {
    super(options);
    this.children[0].destroy(); // remove File image first..
    var videoElement = document.createElement("video");
    videoElement.loop = true;
    videoElement.src = options.resource_path;
    this.video = new PIXI.Sprite(PIXI.Texture.fromVideo(videoElement));
    this.video.anchor.set(0.5);
    videoElement.addEventListener('error', () => {
      this.video.texture = PIXI.Texture.fromImage("assets/file_error.png");
    })
    this.addChildAt(this.video, 0);
  }

  getHitboxSize() {
    return {width: this.video.width - 20, height: this.video.height - 20}
  }
}
