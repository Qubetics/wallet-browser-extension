const path = require("path");
const webpack = require("webpack");

// Load environment variables from .env file
require("dotenv").config();

// Create an object with all REACT_APP_* environment variables
const envVars = {};
Object.keys(process.env).forEach((key) => {
  if (key.startsWith("REACT_APP_")) {
    envVars[`process.env.${key}`] = JSON.stringify(process.env[key]);
  }
});

module.exports = {
  entry: {
    background: "./public/background.js",
    contentscript: "./public/contentscript.js",
    inpage: "./public/inpage.js",
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
    new webpack.DefinePlugin(envVars),
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
