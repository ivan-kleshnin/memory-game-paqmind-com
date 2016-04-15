"use strict";

let Path = require("path")
let Webpack = require("webpack")

module.exports = {
  // webpack.github.io/docs/configuration.html#target
  target: "web",

  // webpack.github.io/docs/configuration.html#entry
  entry: {
    "app": "./src/app",
  },

  output: {
    // webpack.github.io/docs/configuration.html#output-path
    path: __dirname,

    // webpack.github.io/docs/configuration.html#output-filename
     filename: "public/bundle.js",

    // webpack.github.io/docs/configuration.html#output-publicpath
    publicPath: "http://localhost:2992/",

    // webpack.github.io/docs/configuration.html#output-pathinfo
    pathinfo: true,
  },

  // webpack.github.io/docs/configuration.html#debug
  debug: true,

  // webpack.github.io/docs/configuration.html#devtool
  devtool: "source-map",

  // webpack.github.io/docs/configuration.html#module
  module: {
    loaders: [ // webpack.github.io/docs/loaders.html
      // JS: github.com/babel/babel-loader
      {test: /\.js$/, loaders: ["babel"], exclude: /node_modules/},

      // CSS: github.com/webpack/css-loader
      {test: /\.(css(\?.*)?)$/, loaders: ["style", "css"]},

      // LESS: github.com/webpack/less-loader
      {test: /\.(less(\?.*)?)$/, loaders: ["style", "css", "less"]},
    ],
  },
}
