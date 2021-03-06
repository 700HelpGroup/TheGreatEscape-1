const path = require("path");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const ZipPlugin = require("zip-webpack-plugin");
const WebpackBundleAnalyzer =
  require("webpack-bundle-analyzer").BundleAnalyzerPlugin;

module.exports = {
  entry: "./src/main.js",
  output: {
    filename: "src/main.[contenthash].js",
    path: path.resolve(__dirname, "build"),
  },
  plugins: [
    new HtmlWebpackPlugin({ template: "./src/index.html" }),
    new ZipPlugin({ path: __dirname, filename: "build.zip" }),
    // new WebpackBundleAnalyzer(),
  ],
};
