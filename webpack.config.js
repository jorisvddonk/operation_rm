var path = require('path');
var LiveReloadPlugin = require('webpack-livereload-plugin');

module.exports = {
  entry: './client/index.js',
  output: {
    filename: 'bundle.js',
    path: path.resolve('./client/dist')
  },
  plugins: [
    new LiveReloadPlugin({appendScriptTag: true})
  ]
};