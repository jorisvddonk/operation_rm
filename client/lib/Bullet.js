import _ from 'lodash';
const PIXI = require('pixi.js');

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
  container.tick = function(delta) {
    container.position.x += container.state.velocity.x;
    container.position.y += container.state.velocity.y;
    container.state.lifetime -= delta;
    if (container.state.lifetime < 0) {
      destroy();
    }
  };
  container.wire = function(app) {
    app.bullets.addChild(container);
  };
  return container;
};