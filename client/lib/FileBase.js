import _ from 'lodash';
const PIXI = require('pixi.js');
export default class FileBase extends PIXI.Container {
  constructor(options) {
    super();
  }

  getHitboxSize() {
    return {width: this.width - 20, height: this.height - 30}
  }

  wire (app) {}
  gfxTick (delta) {}
  lifetimeTick () {}
  registerHit() {}
}
