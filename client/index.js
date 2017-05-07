import _ from 'lodash';
import keycodes from './lib/keycodes'
const PIXI = require('pixi.js');
const koaws = require('koa-ws/client');

var rootElement = document.getElementById('main');

var keyState = keycodes(window, ["ArrowLeft", "ArrowUp", "ArrowDown", "ArrowRight"]);


var app = new PIXI.Application(800, 600, {backgroundColor : 0x000000});
rootElement.appendChild(app.view);

var addParallaxLayer = function(assetLocation) {
  var layer = new PIXI.Sprite(PIXI.Texture.fromImage(assetLocation));
  layer.position.x = 0;
  layer.position.y = 0;
  app.stage.addChild(layer);
};

addParallaxLayer("assets/parallax_1_0.png");
addParallaxLayer("assets/parallax_2.png");
addParallaxLayer("assets/parallax_3.png");
addParallaxLayer("assets/parallax_4.png");

var ship = new PIXI.Sprite(PIXI.Texture.fromImage("assets/ship.png"));
ship.position.x = 400;
ship.position.y = 400;
ship.anchor.set(0.5);
ship.state = {
  velocity: {
    x: 0,
    y: 0
  }
}
app.stage.addChild(ship);

app.ticker.add(function(delta) {
  // center ship in stage
  app.stage.pivot.x = ship.position.x;
  app.stage.pivot.y = ship.position.y;
  app.stage.position.x = app.renderer.width*0.5;
  app.stage.position.y = app.renderer.height*0.5;

  // Handle keypresses for ship
  if (keyState.ArrowLeft) {
    ship.rotation -= 0.1
  }
  if (keyState.ArrowRight) {
    ship.rotation += 0.1
  }
  if (keyState.ArrowUp) {
    ship.state.velocity.x -= Math.sin(ship.rotation+Math.PI) * 0.1;
    ship.state.velocity.y += Math.cos(ship.rotation+Math.PI) * 0.1;
  }

  // Update ship position
  ship.position.x += ship.state.velocity.x;
  ship.position.y += ship.state.velocity.y;
});
