import _ from 'lodash';
const PIXI = require('pixi.js');

/*
Game utility object: Shooter. Essentially a bullet emitter...
*/
export default class Shooter {
  constructor(shootRate, spawnFunc) {
    this.shootRate = shootRate;
    this.spawnFunc = spawnFunc;
    this.delay = 0;
  }

  shoot() {
    if (this.delay <= 0) {
      this.spawnFunc();
      this.delay = this.shootRate;
    }
  }

  wire(app) {
    app.ticker.add((delta) => {
      this.delay -= delta;
    });
  }
};
