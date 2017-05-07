var app = new PIXI.Application(800, 600, {backgroundColor : 0xffffff});
document.getElementById('main').appendChild(app.view);

app.ticker.add(function(delta) {
  // tick!
});
