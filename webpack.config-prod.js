"use strict";

let Autoprefixer = require("autoprefixer")
let ExtractTextPlugin = require("extract-text-webpack-plugin")
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
    filename: "[name].js",

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
      {test: /\.js$/, loaders: ["babel"], exclude: /node_modules/},

      // CSS: github.com/webpack/css-loader
      {test: /\.(css(\?.*)?)$/, loaders: ["style", "css"]},

      // LESS: github.com/webpack/less-loader
      {test: /\.(less(\?.*)?)$/, loaders: ["style", "css", "less"]},

      // JSON: github.com/webpack/json-loader
      {test: /\.(json(\?.*)?)$/,  loaders: ["json"]},
    ],
  },

  // github.com/postcss/autoprefixer
  postcss: [Autoprefixer()],

  // webpack.github.io/docs/list-of-plugins.html
  plugins: [
    new ExtractTextPlugin("[name].css", {allChunks: true}),
    new Webpack.optimize.UglifyJsPlugin({compress: {warnings: false}, mangle: {except: ["$", "window", "document", "console"]}}),
  ],
}
