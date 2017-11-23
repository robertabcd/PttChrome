const path = require('path');
const webpack = require('webpack');
const UglifyJSPlugin = require('uglifyjs-webpack-plugin');
const ExtractTextPlugin = require('extract-text-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const HtmlWebpackHarddiskPlugin = require('html-webpack-harddisk-plugin');

const DEVELOPER_MODE = process.env.NODE_ENV === 'development'
const PRODUCTION_MODE = process.env.NODE_ENV === 'production'

module.exports = {
  entry: {
    'pttchrome': [
      './src/js/main.js',
      './src/css/main.css',
      './src/css/color.css'
    ]
  },
  output: {
    path: path.join(__dirname, 'dist/assets/'),
    publicPath: 'assets/',
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
        loader: "babel-loader"
      },
      {
        test: /\.css$/,
        use: ExtractTextPlugin.extract({
          publicPath: './',      
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
        test: /\.(bin|bmp|png|woff)$/,
        use: [
          {
            loader: 'file-loader',
            options: {
              name: '[name].[hash].[ext]'
            }  
          }
        ]
      }
    ]
  },
  devtool: 'source-map',
  plugins: [
    new webpack.DefinePlugin({
      'process.env.PTTCHROME_PAGE_TITLE': JSON.stringify(process.env.PTTCHROME_PAGE_TITLE || 'PttChrome'),
      'process.env.DEFAULT_SITE': JSON.stringify(PRODUCTION_MODE ? 'wsstelnet://ws.ptt.cc/bbs' : 'wstelnet://localhost:8080/bbs'),
      'process.env.ENABLE_GOTO_OTHER_SITE': JSON.stringify(false),
      'process.env.DEVELOPER_MODE': JSON.stringify(DEVELOPER_MODE),
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
      inject: 'head',
      template: './src/dev.html',
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
    contentBase: path.join(__dirname, './dist'),
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
