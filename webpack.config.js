const path = require('path');
const webpack = require('webpack');
const UglifyJSPlugin = require('uglifyjs-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const HtmlWebpackHarddiskPlugin = require('html-webpack-harddisk-plugin');
const WebpackCdnPlugin = require('webpack-cdn-plugin');

module.exports = (env, argv) => {
  const DEVELOPER_MODE = argv.mode === 'development';
  const PRODUCTION_MODE = argv.mode === 'production';

  return {
    entry: {
      'pttchrome': './src/entry.js',
    },
    output: {
      path: path.join(__dirname, 'dist/assets/'),
      publicPath: 'assets/',
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
          use: [
            {
              loader: MiniCssExtractPlugin.loader,
              options: {
                publicPath: './'
              }
            },
            {
              loader: "css-loader",
              options: {
                minimize: PRODUCTION_MODE,
                sourceMap: true
              }
            }
          ]
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
    optimization: {
      minimizer: [
        new UglifyJSPlugin({
          sourceMap: true,
          parallel: true
        }),
      ]
    },
    plugins: [
      new webpack.DefinePlugin({
        'process.env.PTTCHROME_PAGE_TITLE': JSON.stringify(process.env.PTTCHROME_PAGE_TITLE || 'PttChrome'),
        'process.env.DEFAULT_SITE': JSON.stringify(PRODUCTION_MODE ? 'wsstelnet://ws.ptt.cc/bbs' : 'wstelnet://localhost:8080/bbs'),
        'process.env.ALLOW_SITE_IN_QUERY': JSON.stringify(process.env.ALLOW_SITE_IN_QUERY === 'yes'),
        'process.env.DEVELOPER_MODE': JSON.stringify(DEVELOPER_MODE),
      }),
      new MiniCssExtractPlugin({
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
      }),
      ... DEVELOPER_MODE ? [
        new HtmlWebpackHarddiskPlugin()
      ] : []
    ],
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
};
