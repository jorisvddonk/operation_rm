import _ from 'lodash';
import keycodes from './lib/keycodes';
import ParallaxLayer from './lib/Parallaxlayer';
import File from './lib/File';
import Bullet from './lib/Bullet';
import Shooter from './lib/Shooter';
const PIXI = require('pixi.js');
var path = require('path');

var rootElement = document.getElementById('main');

var keyState = keycodes(window, ["ArrowLeft", "ArrowUp", "ArrowDown", "ArrowRight", "Space"]);


var app = new PIXI.Application(800, 600, {backgroundColor : 0x000000});
rootElement.appendChild(app.view);
window.app = app;
app.topLayer = new PIXI.Container();
app.middleLayer = new PIXI.Container();
app.bottomLayer = new PIXI.Container();
app.bullets = new PIXI.Container();

app.stage.addChild(app.bottomLayer);
app.stage.addChild(app.middleLayer);
app.stage.addChild(app.bullets);
app.stage.addChild(app.topLayer);


var addParallaxLayer = function(assetLocation, depth) {
  var layer = new ParallaxLayer({assetLocation: assetLocation, depth: depth})
  layer.wire(app);
  app.bottomLayer.addChild(layer);
};

addParallaxLayer("assets/parallax_1_0.png", 4);
addParallaxLayer("assets/parallax_2.png", 3);
addParallaxLayer("assets/parallax_3.png", 2);
addParallaxLayer("assets/parallax_4.png", 1);

var addFile = function(fileoptions) {
  var abspath = path.join('/data/demo', fileoptions.name);
  var file = new File({
    abspath: abspath,
    filename: fileoptions.name
  });
  file.position.x = _.random(500);
  file.position.y = _.random(500);
  file.wire(app);
  app.middleLayer.addChild(file);
}
var addVideo = function(fileoptions) {
  addFile(fileoptions); // todo implement correctly
}
var addImage = function(fileoptions) {
  addFile(fileoptions); // todo implement correctly
}

fetch('/data/demo').then(function(res){
  return res.json()
}).then(function(filelist){
  _.each(filelist, function(file) {
    if (file.type === 'image') {
      addImage(file);
    } else if (file.type === 'video') {
      addVideo(file);
    } else {
      addFile(file);
    }
  });
})

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
app.topLayer.addChild(ship);

ship.shooter = new Shooter(3, function() {
  var bullet = new Bullet(ship.position.x, ship.position.y, ship.state.velocity.x, ship.state.velocity.y, ship.rotation + Math.random() * 0.03 - 0.015);
  bullet.wire(app);
});
ship.shooter.wire(app);

app.ticker.add(function(delta) {
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
  if (keyState.ArrowDown) {
    ship.state.velocity.x -= Math.sin(ship.rotation+Math.PI) * -0.05;
    ship.state.velocity.y += Math.cos(ship.rotation+Math.PI) * -0.05;
  }
  if (keyState.Space) {
    ship.shooter.shoot();
  }

  // Update ship position
  ship.position.x += ship.state.velocity.x;
  ship.position.y += ship.state.velocity.y;

  // center ship in stage
  app.stage.pivot.x = ship.position.x;
  app.stage.pivot.y = ship.position.y;
  app.stage.position.x = app.renderer.width*0.5;
  app.stage.position.y = app.renderer.height*0.5;

  // Move bullets
  _.each(app.bullets.children, function(bullet) {
    if (bullet) {
      bullet.tick(delta);
    }
  })
});


var socket = require('socket.io-client')('http://127.0.0.1.xip.io:8099');
socket.on('connect', function(x){
  console.log("Connected to Socket.IO backend"); 
});
socket.on('message', function(data){console.log("MSG", data)});
socket.on('disconnect', function(){
  console.log("Disconnected from Socket.IO backend");
});
