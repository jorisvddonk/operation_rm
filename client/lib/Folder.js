import _ from 'lodash';
import FileBase from './FileBase';
const PIXI = require('pixi.js');

/*
Game object: a folder on the user's filesytem.
*/
export default class Folder extends FileBase {
  constructor(options) {
    super(options);
    this.folderSprite = new PIXI.Sprite(PIXI.Texture.fromImage(`assets/folder${options.name === '..' ? '_up' : ''}.png`));
    this.folderSprite.anchor.set(0.5);

    var text = new PIXI.Text(options.name,{fontFamily : 'Arial', fontSize: 10, fill : 'white', align : 'center', stroke: 'black', strokeThickness: 2});
    text.anchor.set(0.5);
    text.position.y = 40;
    this.addChild(this.folderSprite);
    this.addChild(text);
  }

  getHitboxSize() {
    return {width: this.folderSprite.width - 20, height: this.folderSprite.height - 20}
  }

}
