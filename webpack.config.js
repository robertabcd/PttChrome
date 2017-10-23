const path = require('path');
const webpack = require('webpack');
const CleanWebpackPlugin = require('clean-webpack-plugin');
const UglifyJSPlugin = require('uglifyjs-webpack-plugin');
const ExtractTextPlugin = require('extract-text-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = {
  entry: {
    'pttchrome': [
      './js/main.js',
      './css/main.css',
      './css/color.css'
    ]
  },
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: '[name].[chunkhash].js'
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
      },
      {
        test: /\.css$/,
        use: ExtractTextPlugin.extract({
          fallback: "style-loader",
          use: {
            loader: "css-loader",
            options: {
              minimize: true,
              sourceMap: true
            }
          }
        })
      },
      {
        test: /\.(bmp|png|woff)$/,
        loader: "file-loader"
      }
    ]
  },
  devtool: 'source-map',
  plugins: [
    new CleanWebpackPlugin(['dist', 'index.html']),
    new UglifyJSPlugin({
      sourceMap: true,
      parallel: true
    }),
    new webpack.DefinePlugin({
      'COMPILE_CONSTANTS': JSON.stringify({
        DEFAULT_SITE: 'wsstelnet://ws.ptt.cc/bbs',
        ENABLE_GOTO_OTHER_SITE: false,
        DEVELOPER_MODE: true,
      })
    }),
    new ExtractTextPlugin({
      filename: '[name].[chunkhash].css'
    }),
    new HtmlWebpackPlugin({
      minify: {
        collapseWhitespace: true,
        removeComments: true
      },
      inject: false,
      template: 'dev.html',
      filename: '../index.html'
    })
  ]
};
