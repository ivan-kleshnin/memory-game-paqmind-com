"use strict";

let AssetsPlugin = require("assets-webpack-plugin");
let Autoprefixer = require("autoprefixer");
let ExtractTextPlugin = require("extract-text-webpack-plugin");
let Path = require("path")
let Webpack = require("webpack")

module.exports = {
  // webpack.github.io/docs/configuration.html#target
  target: "web",

  // webpack.github.io/docs/configuration.html#entry
  entry: {
    "bundle": "./src/app",
  },

  output: {
    // webpack.github.io/docs/configuration.html#output-path
    path: Path.resolve(__dirname, "public"),

    // webpack.github.io/docs/configuration.html#output-filename
    filename: "[name].js?[chunkhash]",

    // webpack.github.io/docs/configuration.html#output-publicpath
    publicPath: "/",

    // webpack.github.io/docs/configuration.html#output-pathinfo
    pathinfo: false,
  },

  // webpack.github.io/docs/configuration.html#debug
  debug: false,

  // webpack.github.io/docs/configuration.html#module
  module: {
    loaders: [ // webpack.github.io/docs/loaders.html
      // JS: github.com/babel/babel-loader
      {test: /\.js$/, loaders: ["babel?presets[]=es2015"], exclude: /node_modules/},

      // CSS: github.com/webpack/css-loader
      {test: /\.(css(\?.*)?)$/, loaders: ["style", "css"]},

      // LESS: github.com/webpack/less-loader
      {test: /\.(less(\?.*)?)$/, loaders: ["style", "css", "less"]},
    ],
  },

  // https://github.com/postcss/autoprefixer
  postcss: [Autoprefixer()],

  // http://webpack.github.io/docs/list-of-plugins.html
  plugins: [
    new ExtractTextPlugin("[name].css?[contenthash]", {allChunks: true}),
    new AssetsPlugin({
      path: Path.resolve(__dirname, "public"),
      prettyPrint: true,
    }),
    new Webpack.optimize.DedupePlugin(),
    new Webpack.optimize.UglifyJsPlugin({compress: {warnings: false}, mangle: {except: ["$", "window", "document", "console"]}}),
  ],
}
