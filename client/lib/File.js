import _ from 'lodash';
import FileBase from './FileBase';
const PIXI = require('pixi.js');

/*
Game object: A non-image, non-video file on a user's filesystem.
*/
export default class File extends FileBase {
  constructor(options) {
    super(options);
    var fileSprite = new PIXI.Sprite(PIXI.Texture.fromImage("assets/file.png"));
    fileSprite.anchor.set(0.5);
    this.damageSprites = new PIXI.Container();
    _.each(_.range(1, 10), (i) => {
      var sprite = new PIXI.Sprite(PIXI.Texture.fromImage("assets/dmg_" + i + ".png"));
      sprite.visible = false;
      sprite.anchor.set(0.5);
      this.damageSprites.addChild(sprite);
    });

    var text = new PIXI.Text(options.name,{fontFamily : 'Arial', fontSize: 10, fill : 'white', align : 'center', stroke: 'black', strokeThickness: 2});
    text.anchor.set(0.5);
    text.position.y = 40;
    this.addChild(fileSprite);
    this.addChild(text);
    this.addChild(this.damageSprites);

    this.state = {
      hitpoints: 10
    }
  }

  /*
  Update graphics of the file
  */
  gfxTick() {
    _.each(this.damageSprites.children, (sprite, i) => {
      sprite.visible = false;
      if (9 - this.state.hitpoints === i) {
        sprite.visible = true;
      }
    })
  }

  /*
  Check if the file should be destroyed (if it's HP is lower or equal to zero)
  Returns true if the file was destroyed; false otherwise.
  */
  lifetimeTick(delta) {
    if (this.state.hitpoints <= 0) {
      this.destroy();
      return true;
    }
    return false;
  }
  
  /*
  Register a hit on this file
  */
  registerHit() {
    this.state.hitpoints -= 1;
  }

  getHitboxSize() {
    return {width: 30, height: 20}
  }
}
