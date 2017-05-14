import _ from 'lodash';
import keycodes from './lib/keycodes';
import ParallaxLayer from './lib/Parallaxlayer';
import File from './lib/File';
import Folder from './lib/Folder';
import VideoFile from './lib/VideoFile';
import ImageFile from './lib/ImageFile';
import Bullet from './lib/Bullet';
import Shooter from './lib/Shooter';
import Vue from 'vue';
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
app.files = new PIXI.Container();

app.stage.addChild(app.bottomLayer);
app.stage.addChild(app.middleLayer);
app.stage.addChild(app.bullets);
app.stage.addChild(app.files);
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

var add = function(thing) {
  thing.position.x = _.random(500);
  thing.position.y = _.random(500);
  thing.wire(app);
  app.files.addChild(thing);
}

var enterDirectory = function(dirPath) {
  vue_app.currentfolder = dirPath;
  app.files.removeChildren();
  app.ship.position.x = 0;
  app.ship.position.y = 0;
  app.ship.state.velocity.x = 0;
  app.ship.state.velocity.y = 0;
  fetch('/data/' + dirPath).then(function(res){
    return res.json()
  }).then(function(filelist){
    _.each(filelist, function(file) {
      file.relpath = path.join(dirPath, file.name);
      file.resource_path = path.join('/data', file.relpath);
      if (file.type === 'image') {
        add(new ImageFile(file));
      } else if (file.type === 'video') {
        add(new VideoFile(file));
      } else if (file.type === 'folder')  {
        add(new Folder(file));
      } else {
        add(new File(file));
      }
    });
    add(new Folder({
      name: '..',
      type: 'folder',
      relpath: path.dirname(dirPath)
    }));
  });
};

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
app.ship = ship;
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
  app.stage.pivot.x = ship.position.x - app.renderer.width*0.5;
  app.stage.pivot.y = ship.position.y - app.renderer.height*0.5;

  /*
  Handle bullets and hit detection.
  This happens in a few stages:
  1) Move all bullets and test if they've hit any files. If so; register the hit and mark the bullet as deceased
  2) Destroy all bullets that have deceased
  3) Update graphics for all files (show damage correctly)
  4) Destroy all files that have been damaged to obadly

  The actual hit detection is rather basic and naïve. It's a simple point-box test between ALL bullets and ALL files.
  As there are probably not that many bullets active at any given point, and the number of files is probably not that great, this should be okay for now.
  An easy way of improving this would be to divide the game world up into sectors and only checking for hit detections within a sector and its eight neighbors.

  Unfortunately, this code is unnecessarily messy. This is mostly because of the way PIXI.JS works:
  * When a Container is destroyed, it's cleaned up entirely, meaning that any references you might still have to it will error out with an NPE if you try to access properties like `position.x`.
  * When a Container is destroyed, it's removed from the `children` array of its parent in two phases: 
    first, the reference is replaced with `undefined`, and after the current but before the next game tick all falsy values are removed ffrom the `children` array.
    This means that if you *just* destroyed a Container and iterate through its parent's `children` array, you'll eventually hit `undefined`...
    Naturally, this could be avoided by wrapping `app.{...}.children` in `_.compact`. Though this would result in cleaner code, it'd perform slower than what is actually implemented below.
  */
  _.each(app.bullets.children, function(bullet) {
    if (bullet) {
      bullet.movementTick(delta);
      _.each(app.files.children, function(file) {
        const dx = Math.abs(bullet.position.x - file.position.x);
        const dy = Math.abs(bullet.position.y - file.position.y);
        const hitboxSize = file.getHitboxSize();
        if (dx < hitboxSize.width && dy < hitboxSize.height) {
          file.registerHit();
          bullet.markDeceased();
        }
      });
    }
  });
  // Destroy all bullets that have 'deceased'
  _.each(app.bullets.children, function(bullet) {
    if (bullet) {
      bullet.lifetimeTick(delta);
    }
  });
  // Update gfx for all files
  _.each(app.files.children, function(file) {
    file.gfxTick();
  });
  // Destroy all files that have been damaged too badly
  _.each(app.files.children, function(file) {
    if (file) {
      file.lifetimeTick(delta);
    }
  });

  // Check if player ship is touching a folder; if so, enter it!
  _.each(app.files.children, function(file) {
    if (file instanceof Folder) {
      const dx = Math.abs(ship.position.x - file.position.x);
      const dy = Math.abs(ship.position.y - file.position.y);
      if (dx*dx+dy*dy < 1500) {
        enterDirectory(file.filedetails.relpath);
      }
    }
  });
});

var socket = require('socket.io-client')(window.location.href);
socket.on('connect', function(x){
  console.log("Connected to Socket.IO backend"); 
});
socket.on('message', function(data){console.log("MSG", data)});
socket.on('loadavg', function(data){
  vue_app.load = data;
});
socket.on('hostname', function(data){
  vue_app.hostname = data;
});
socket.on('freemem', function(data){
  vue_app.freemem = data;
});
socket.on('disconnect', function(){
  console.log("Disconnected from Socket.IO backend");
});


Vue.component('loadavg', {
  props: ['load'],
  template: '#loadavg',
  data: function(){
    return {
    }
  }
});
Vue.component('hostname', {
  props: ['hostname'],
  template: '#hostname',
  data: function(){
    return {
    }
  }
});
Vue.component('freemem', {
  props: ['freemem'],
  template: '#freemem',
  data: function(){
    return {
    }
  }
});
Vue.component('currentfolder', {
  props: ['currentfolder'],
  template: '#currentfolder',
  data: function(){
    return {
    }
  }
});
var vue_app = new Vue({
  el: '#vue',
  data: {
    load: null,
    hostname: null,
    freemem: null,
    currentfolder: ''
  },
  mounted: function() {}
});
window.vue_app = vue_app;

// Finally, enter the root directory!
enterDirectory('.');