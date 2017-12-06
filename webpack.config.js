const path = require('path');
const webpack = require('webpack');
const UglifyJSPlugin = require('uglifyjs-webpack-plugin');
const ExtractTextPlugin = require('extract-text-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const HtmlWebpackHarddiskPlugin = require('html-webpack-harddisk-plugin');
const WebpackCdnPlugin = require('webpack-cdn-plugin');

const DEVELOPER_MODE = process.env.NODE_ENV === 'development'
const PRODUCTION_MODE = process.env.NODE_ENV === 'production'

module.exports = {
  entry: {
    'pttchrome': './src/entry.js',
  },
  output: {
    path: path.join(__dirname, 'dist/assets/'),
    publicPath: 'assets/',
    pathinfo: DEVELOPER_MODE,
    filename: `[name]${ PRODUCTION_MODE ? '.[chunkhash]' : '' }.js`
  },
  externals: {
    jquery: 'jQuery',
  },
  module: {
    rules: [
      {
        test: /\.js$/,
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
        oneOf: [
          {
            resourceQuery: /inline/,
            use: 'url-loader'
          },
          {
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
      }
    ]
  },
  devtool: 'source-map',
  plugins: [
    new webpack.DefinePlugin({
      'process.env.PTTCHROME_PAGE_TITLE': JSON.stringify(process.env.PTTCHROME_PAGE_TITLE || 'PttChrome'),
      'process.env.DEFAULT_SITE': JSON.stringify(PRODUCTION_MODE ? 'wsstelnet://ws.ptt.cc/bbs' : 'wstelnet://localhost:8080/bbs'),
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
    }),
    new WebpackCdnPlugin({
      modules: [
        {
          name: 'react',
          var: 'React',
          path: 'umd/react.production.min.js',
        },
        {
          name: 'react-dom',
          var: 'ReactDOM',
          path: 'umd/react-dom.production.min.js',
        },
      ],
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
