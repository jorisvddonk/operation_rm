import _ from 'lodash';
const PIXI = require('pixi.js');

/*
Game object: A simple Bullet that moves across the playing field...
*/
export default function(x, y, vx, vy, direction) {
  var container = new PIXI.Container();
  var sprite = new PIXI.Sprite(PIXI.Texture.fromImage("assets/bullet.png"));
  var ticker;
  sprite.anchor.set(0.5);
  container.addChild(sprite);
  
  container.state = {
    lifetime: 30,
    velocity: {
      x: (vx - Math.sin(direction+Math.PI)*8),
      y: (vy + Math.cos(direction+Math.PI)*8)
    }
  }
  container.position.x = x;
  container.position.y = y;
  var destroy = function() {
    container.destroy();
  };
  container.movementTick = function(delta) {
    container.position.x += container.state.velocity.x * delta;
    container.position.y += container.state.velocity.y * delta;
  };
  container.lifetimeTick = function(delta) {
    container.state.lifetime -= delta;
    if (container.state.lifetime < 0) {
      destroy();
    }
  }
  container.markDeceased = function() {
    container.state.lifetime = 0;
  }
  container.wire = function(app) {
    app.bullets.addChild(container);
  };
  return container;
};
