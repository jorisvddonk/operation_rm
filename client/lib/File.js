import _ from 'lodash';
const PIXI = require('pixi.js');

export default function(options) {
  var container = new PIXI.Container();
  var fileSprite = new PIXI.Sprite(PIXI.Texture.fromImage("assets/file.png"));
  fileSprite.anchor.set(0.5);
  var text = new PIXI.Text(options.filename,{fontFamily : 'Arial', fontSize: 10, fill : 'white', align : 'center', stroke: 'black', strokeThickness: 2});
  text.anchor.set(0.5);
  text.position.y = 40;
  container.addChild(fileSprite);
  container.addChild(text);
  
  container.wire = function(app) {
    // nothing needed here so far!
  }
  container.state = {
    hitpoints: 10
  }
  container.lifetimeTick = function(delta) {
    if (container.state.hitpoints <= 0) {
      container.destroy();
    }
  }
  container.registerHit = function() {
    container.state.hitpoints -= 1;
  }
  return container;
};
