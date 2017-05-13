import _ from 'lodash';
const PIXI = require('pixi.js');
export default class File extends PIXI.Container {
  constructor(options) {
    super();
    var fileSprite = new PIXI.Sprite(PIXI.Texture.fromImage("assets/file.png"));
    fileSprite.anchor.set(0.5);
    this.damageSprites = new PIXI.Container();
    _.each(_.range(1, 10), (i) => {
      var sprite = new PIXI.Sprite(PIXI.Texture.fromImage("assets/dmg_" + i + ".png"));
      sprite.visible = false;
      sprite.anchor.set(0.5);
      this.damageSprites.addChild(sprite);
    });

    var text = new PIXI.Text(options.filename,{fontFamily : 'Arial', fontSize: 10, fill : 'white', align : 'center', stroke: 'black', strokeThickness: 2});
    text.anchor.set(0.5);
    text.position.y = 40;
    this.addChild(fileSprite);
    this.addChild(text);
    this.addChild(this.damageSprites);

    this.state = {
      hitpoints: 10
    }
  }

  wire() {
      // nothing needed here so far!
  }
  
  gfxTick() {
    _.each(this.damageSprites.children, (sprite, i) => {
      sprite.visible = false;
      if (9 - this.state.hitpoints === i) {
        sprite.visible = true;
      }
    })
  }

  lifetimeTick(delta) {
    if (this.state.hitpoints <= 0) {
      this.destroy();
    }
  }
  
  registerHit() {
    this.state.hitpoints -= 1;
  }
}
