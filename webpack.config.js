const path = require('path');
const UglifyJSPlugin = require('uglifyjs-webpack-plugin');

const appName = 'pttchrome';

module.exports = {
  entry: [
    './js/main.js'
  ],
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: appName + '.min.js'
  },
  resolve: {
    extensions: ['.js', '.jsx']
  },
  module: {
    rules: [
      {
        test: /\.jsx?$/,
        exclude: /node_modules/,
        loader: "babel-loader",
        query: {
          presets: ['es2015', 'react']
        }
      }
    ]
  },
  devtool: 'source-map',
  plugins: [
    new UglifyJSPlugin({
      sourceMap: true
    })
  ]
};
