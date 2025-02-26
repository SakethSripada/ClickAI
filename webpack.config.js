const path = require('path');
const webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
require('dotenv').config(); // Ensure environment variables are loaded

module.exports = {
  entry: {
    popup: './src/index.js',
    content: './public/content.js',
    background: './public/background.js',
  },
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: '[name].bundle.js',
  },
  module: {
    rules: [
      {
        test: /\.jsx?$/,
        exclude: /node_modules/,
        use: 'babel-loader',
      },
      {
        test: /\.css$/i,
        use: ['style-loader', 'css-loader'],
      },
    ],
  },
  resolve: {
    extensions: ['.js', '.jsx'],
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: './public/index.html',
      filename: 'index.html',
      chunks: ['popup'],
    }),
    new CopyWebpackPlugin({
      patterns: [
        { from: 'public/manifest.json', to: 'manifest.json' },
        { from: 'public/logo192.png', to: 'logo192.png' },
        { from: 'public/tex-chtml.js', to: 'tex-chtml.js' },
        { from: 'public/sandbox.html', to: 'sandbox.html' },
        { from: 'public/mathjax-handler.js', to: 'mathjax-handler.js' },
      ],
    }),
    new webpack.ProvidePlugin({
      React: "react",
      createRoot: ['react-dom/client', 'createRoot'],
    }),
    // Inject the EXTENSION_SECRET from the env file into your bundled code.
    new webpack.DefinePlugin({
      'process.env.EXTENSION_SECRET': JSON.stringify(process.env.EXTENSION_SECRET || 'd3a1f6e4b8c9d7e2a3f1c5b6a9e8d7c4'),
    }),
  ],
  mode: 'production',
};
