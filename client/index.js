import _ from 'lodash';
import keycodes from './lib/keycodes';
import ParallaxLayer from './lib/Parallaxlayer';
import File from './lib/File';
import Folder from './lib/Folder';
import VideoFile from './lib/VideoFile';
import ImageFile from './lib/ImageFile';
import Bullet from './lib/Bullet';
import Ship from './lib/Ship';
import Vue from 'vue';
import VueComponents from './lib/VueComponents';
import seedrandom from 'seedrandom';
import cuid from 'cuid';
const PIXI = require('pixi.js');
var path = require('path');

// Setup keyboard listener
var keyState = keycodes(window, ["ArrowLeft", "ArrowUp", "ArrowDown", "ArrowRight", "Space"]);

// Setup socket
var socket = require('socket.io-client')(window.location.href);

// Create PIXI Application
// The PIXI Application is responsible for most of the game's workings and rendering.
var app = new PIXI.Application(800, 600, {backgroundColor : 0x000000});
document.getElementById('main').appendChild(app.view);

// Setup layers containing game objects
app.topLayer = new PIXI.Container();
app.middleLayer = new PIXI.Container();
app.bottomLayer = new PIXI.Container();
app.bullets = new PIXI.Container();
app.files = new PIXI.Container();
app.otherShips = new PIXI.Container();
// Layers added later are rendered above layers added earlier
app.stage.addChild(app.bottomLayer);
app.stage.addChild(app.middleLayer);
app.stage.addChild(app.bullets);
app.stage.addChild(app.files);
app.stage.addChild(app.otherShips);
app.stage.addChild(app.topLayer);

// Add background parallax layers
var addParallaxLayer = function(assetLocation, depth) {
  var layer = new ParallaxLayer({assetLocation: assetLocation, depth: depth})
  layer.wire(app);
  app.bottomLayer.addChild(layer);
};
addParallaxLayer("assets/parallax_1_0.png", 4);
addParallaxLayer("assets/parallax_2.png", 3);
addParallaxLayer("assets/parallax_3.png", 2);
addParallaxLayer("assets/parallax_4.png", 1);

/*
 Add a game object ('thing') and place it pseudorandomly in the playing field.
 Used in 'enterFolder' function below.
*/
var add = function(thing) {
  var angle;
  var distance;
  if (thing.filedetails.name === '..') { // always place the 'go up one folder' folder in a static position on the playing field
    angle = 0;
    distance = 100;
  } else {
    var rng = seedrandom(thing.filedetails.relpath);
    angle = rng() * 2 * Math.PI;
    distance = (rng() * 2000) + 200;
  }
  thing.position.x = Math.sin(angle) * distance;
  thing.position.y = Math.cos(angle) * distance;
  thing.wire(app); // If the game object needs some extra wiring done with our app instance, it'll be able to do so now.
  app.files.addChild(thing);
};

/*
 Enter a new folder.
 This will fetch the folder's contents from the backend and (re)set the state of the game accordingly.
*/
var enterFolder = function(dirPath) {
  vue_app.currentfolder = '';
  app.files.removeChildren();
  app.ship.position.x = 0;
  app.ship.position.y = 0;
  app.ship.state.velocity.x = 0;
  app.ship.state.velocity.y = 0;
  socket.emit('enterFolder', dirPath);
};
socket.on('enteredFolder', function(dirPath) {
  fetch('/data/' + dirPath).then(function(res){
    return res.json()
  }).then(function(details){
    vue_app.currentfolder = details.absolute_path;
    vue_app.isgameroot = details.is_root;
    _.each(details.contents, function(file) { // Iterate through the files in the folder and add the relevant game objects.
      if (!file.destroyed) {
        file.relpath = path.join(dirPath, file.name);
        file.resource_path = path.join('/data', file.relpath);
        if (file.type === 'image') {
          add(new ImageFile(file));
        } else if (file.type === 'video') {
          add(new VideoFile(file));
        } else if (file.type === 'folder' || file.type === 'folder_up')  {
          add(new Folder(file));
        } else {
          add(new File(file));
        }
      }
    });
    if (dirPath !== '.') { // Add a 'go up' folder ('..') if the user is not in the game root folder.
      add(new Folder({
        name: '..',
        type: 'folder_up',
        relpath: path.dirname(dirPath)
      }));
    }
  });
});

// Create the spaceship the user is going to fly!
var player_identity = cuid();
var ship = new Ship({identity: player_identity});
ship.wire(app);
app.ship = ship;
app.topLayer.addChild(ship);

app.ticker.add(function(delta) {
  // Handle keypresses for ship
  if (keyState.ArrowLeft) {
    ship.rotation -= 0.1;
  }
  if (keyState.ArrowRight) {
    ship.rotation += 0.1;
  }
  if (keyState.ArrowUp) {
    ship.state.velocity.x -= Math.sin(ship.rotation+Math.PI) * 0.1;
    ship.state.velocity.y += Math.cos(ship.rotation+Math.PI) * 0.1;
  }
  if (keyState.ArrowDown) {
    ship.state.velocity.x -= Math.sin(ship.rotation+Math.PI) * -0.05;
    ship.state.velocity.y += Math.cos(ship.rotation+Math.PI) * -0.05;
  }
  ship.state.shooting = keyState.Space;

  // move my own ship
  ship.movementTick(delta);
  // shoot if shooting
  ship.shootMaybe();

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
      if (bullet.owner == player_identity) { // if this is this client's bullet, check hit detection!
        _.each(app.files.children, function(file) {
          const dx = Math.abs(bullet.position.x - file.position.x);
          const dy = Math.abs(bullet.position.y - file.position.y);
          const hitboxSize = file.getHitboxSize();
          if (dx < hitboxSize.width && dy < hitboxSize.height) {
            file.registerHit();
            bullet.markDeceased();
            socket.emit('hitFile', file.filedetails.relpath);
          }
        });
      }
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
  // Destroy all files (locally) that have been damaged too badly
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
        enterFolder(file.filedetails.relpath);
      }
    }
  });

  // Update other ships' positions
  _.each(app.otherShips.children, function(otherShip) {
    otherShip.movementTick(delta);
    otherShip.shootMaybe();
  });

  // Sync some stuff with the Vue.js UI app
  vue_app.shipposition.x = ship.position.x;
  vue_app.shipposition.y = ship.position.y;
  vue_app.number_of_files = app.files.children.length;
  vue_app.otherships = _.map(app.otherShips.children, function(ship) {
    return {
      position: {
        x: ship.position.x,
        y: ship.position.y
      }
    }
  });
});

var getOtherShip = function(identity) {
  var otherShip = _.find(app.otherShips.children, function(s){
    return s.identity === identity;
  });
  if (!otherShip) {
    otherShip = new Ship({identity: identity});
    otherShip.wire(app);
    app.otherShips.addChild(otherShip);
  }
  return otherShip;
}

socket.on('connect', function(x){
  socket.emit('identify', player_identity);
  console.log("Connected to Socket.IO backend"); 
});
socket.on('loadavg', function(data){ // update load average display
  vue_app.load = data;
});
socket.on('hostname', function(data){ // update hostname display
  vue_app.hostname = data;
});
socket.on('freemem', function(data){ // update free memory display
  vue_app.freemem = data;
});
socket.on('disconnect', function(){
  console.log("Disconnected from Socket.IO backend");
});
socket.on('message', function(x) {
  console.log(x);
});
socket.on('shipTick', function(x) {
  getOtherShip(x.identity).processTick(x);
});
socket.on('shipStateUpdate', function(x) {
  getOtherShip(x.identity).processStateUpdate(x);
});
socket.on('fileHPUpdate', function(data) {
  var file = _.find(app.files.children, function(file) {
    return file.filedetails.relpath === data.filepath;
  });
  if (file !== undefined) {
    file.updateHP(data.hp);
  }
});
var pruneShip = function(data) {
  _.find(app.otherShips.children, function(ship) {
    if (ship.identity === data.identity) {
      ship.destroy();
    }
  });
}
socket.on('playerSwitchedFolder', pruneShip);
socket.on('clientDisconnected', pruneShip);

setInterval(function(){
  if (socket.connected) {
    socket.emit('shipTick', {
      identity: player_identity,
      x: ship.position.x,
      y: ship.position.y,
      rotation: ship.rotation,
      velocity: {
        x: ship.state.velocity.x,
        y: ship.state.velocity.y
      },
      shooting: ship.state.shooting
    })
  }
}, 1000/64);

// Setup VueJS application.
// The VueJS application is responsible for rendering various widgets on screen (radar, hostname, load average, etc.)
var vue_app = new Vue({
  el: '#vue',
  components: VueComponents,
  data: {
    load: null,
    hostname: null,
    freemem: null,
    currentfolder: '',
    isgameroot: true,
    number_of_files: 0,
    files: [],
    otherships: [],
    shipposition: {x: 0, y: 0} 
  },
  mounted: function() {},
  watch: {
    number_of_files: function() {
      // Whenever the number of files changes, recompute the state of all files for the Radar UI widget.
      // This is done this way for performance reasons, as observing `app.files.children` directly causes massive performance issues.
      this.files = app.files.children.map(function(file) {
        return {
          position: {
            x: file.position.x,
            y: file.position.y,
          },
          type: file.filedetails.type
        }
      });
    }
  }
});

// Finally, enter the root folder!
enterFolder('.');

// Expose some variables onto the window for debugging / developing.
window.vue_app = vue_app;
window.app = app;
window.socket = socket;