import _ from 'lodash';
import Shooter from './Shooter';
import Bullet from './Bullet';
const PIXI = require('pixi.js');

/*
Game object: ship. Currently only other multiplayer ships.
*/
export default class Ship extends PIXI.Sprite {
  constructor(options) {
    super(PIXI.Texture.fromImage("assets/ship.png"));
    options = options || {};
    this.anchor.set(0.5);
    this.position.x = 0;
    this.position.y = 0;
    if (options.identity) {
      this.identity = options.identity;
    }
    this.state = {
      velocity: {
        x: 0,
        y: 0
      },
      shooting: false
    }
  }

  movementTick (delta) { 
    this.position.x += this.state.velocity.x * delta;
    this.position.y += this.state.velocity.y * delta;
  }

  processTick (data) {
    this.position.x = data.x;
    this.position.y = data.y;
    this.rotation = data.rotation;
    this.state.velocity.x = data.velocity.x;
    this.state.velocity.y = data.velocity.y;
    this.state.shooting = data.shooting;
  }

  processStateUpdate (data) {
    this.state.velocity.x = data.velocity.x;
    this.state.velocity.y = data.velocity.y;
  }
  
  shootMaybe () {
    if (this.state.shooting) {
      this.shooter.shoot();
    }
  }

  wire (app) {
    this.shooter = new Shooter(3, () => {
      var bullet = new Bullet(this.position.x, this.position.y, this.state.velocity.x, this.state.velocity.y, this.rotation + Math.random() * 0.03 - 0.015);
      bullet.wire(app);
    });
    this.shooter.wire(app);
  }

}
