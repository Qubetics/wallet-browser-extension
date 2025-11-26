const path = require("path");
const webpack = require("webpack");

module.exports = {
  entry: {
    background: "./public/background.js",
    contentscript: "./public/contentscript.js",
    inpage: "./public/inpage.js",
    "kepler-inpage": "./public/kepler-inpage.js",
  },
  output: {
    path: path.resolve(__dirname, "public"),
    filename: "[name]-bundle.js",
  },
  plugins: [
    new webpack.ProvidePlugin({
      process: "process/browser",
      Buffer: ["buffer", "Buffer"],
    }),
  ],
  resolve: {
    fallback: {
      crypto: require.resolve("crypto-browserify"),
      http: require.resolve("stream-http"),
      https: require.resolve("https-browserify"),
      url: require.resolve("url"),
      "readable-stream": require.resolve("readable-stream"),
      path: require.resolve("path-browserify"),
      fs: require.resolve("browserify-fs"),
      "obj-multiplex": require.resolve("obj-multiplex"),
      "console": require.resolve("console-browserify"),
      "constants": require.resolve("constants-browserify")
    },
  },
};
