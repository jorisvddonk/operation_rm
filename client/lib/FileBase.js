import _ from 'lodash';
const PIXI = require('pixi.js');

/*
Game object: file. Base class which should be extended from.
*/
export default class FileBase extends PIXI.Container {
  constructor(options) {
    super();
    this.filedetails = options;
  }

  getHitboxSize() {
    return {width: this.width - 20, height: this.height - 30}
  }

  wire (app) {}
  gfxTick (delta) {}
  lifetimeTick () {}
  registerHit() {}
  updateHP() {}
}
