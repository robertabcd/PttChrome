const path = require('path');
const webpack = require('webpack');
const UglifyJSPlugin = require('uglifyjs-webpack-plugin');
const ExtractTextPlugin = require('extract-text-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const HtmlWebpackHarddiskPlugin = require('html-webpack-harddisk-plugin');

const DEVELOPER_MODE = process.env.NODE_ENV === 'development'
const PRODUCTION_MODE = process.env.NODE_ENV === 'production'

const DEFAULT_SITE = PRODUCTION_MODE ? 'wsstelnet://ws.ptt.cc/bbs' : 'wstelnet://localhost:8080/bbs'

module.exports = {
  entry: {
    'pttchrome': [
      './js/main.js',
      './css/main.css',
      './css/color.css'
    ]
  },
  output: {
    path: path.join(__dirname, 'dist/'),
    publicPath: '/dist/',
    pathinfo: DEVELOPER_MODE,
    filename: `[name]${ PRODUCTION_MODE ? '.[chunkhash]' : '' }.js`
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
              minimize: PRODUCTION_MODE,
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
    new webpack.DefinePlugin({
      'COMPILE_CONSTANTS': JSON.stringify({
        DEFAULT_SITE,
        ENABLE_GOTO_OTHER_SITE: false,
        DEVELOPER_MODE,
      })
    }),
    new ExtractTextPlugin({
      disable: DEVELOPER_MODE,
      filename: '[name].[chunkhash].css'
    }),
    new HtmlWebpackPlugin({
      alwaysWriteToDisk: DEVELOPER_MODE,
      minify: {
        collapseWhitespace: PRODUCTION_MODE,
        removeComments: PRODUCTION_MODE
      },
      inject: false,
      template: 'dev.html',
      filename: '../index.html'
    })
  ].concat(PRODUCTION_MODE ? [
    new UglifyJSPlugin({
      sourceMap: true,
      parallel: true
    }),
  ] : [
    new HtmlWebpackHarddiskPlugin()
  ]),
  devServer: {
    proxy: {
      '/bbs': {
        target: 'https://ws.ptt.cc',
        secure: true,
        ws: true,
        changeOrigin: true,
        onProxyReqWs(proxyReq) {
          // Whitelist does not accept ws.ptt.cc
          proxyReq.setHeader('origin', 'https://term.ptt.cc');
        }
      }
    }
  }
};
