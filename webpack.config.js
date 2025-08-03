/**
 * Webpack Configuration for ClickAI Browser Extension
 * 
 * This configuration builds the browser extension from React source code into
 * a properly structured extension that can be loaded into Chrome and other
 * Chromium-based browsers. It handles multiple entry points, environment
 * variable injection, and asset copying.
 * 
 * Build targets:
 * - popup: React-based popup interface
 * - content: Content script injected into web pages
 * - background: Service worker for extension background tasks
 * 
 * @author Saketh Sripada
 * @version 1.0.0
 */

const path = require('path');
const webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');

// Load environment variables from .env file
require('dotenv').config();

module.exports = {
  // Multiple entry points for different parts of the extension
  entry: {
    // Main popup interface - React application
    popup: './src/index.js',
    
    // Content script - injected into web pages
    content: './public/content.js',
    
    // Background script - service worker for extension functionality
    background: './public/background.js',
  },

  // Output configuration for built files
  output: {
    // Build output directory
    path: path.resolve(__dirname, 'dist'),
    
    // File naming pattern - [name] corresponds to entry point names
    filename: '[name].bundle.js',
    
    // Clean output directory before each build
    clean: true,
  },

  // Module rules for processing different file types
  module: {
    rules: [
      {
        // JavaScript and JSX file processing with Babel
        test: /\.jsx?$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            // Babel presets for React and modern JavaScript
            presets: [
              '@babel/preset-env',
              ['@babel/preset-react', { runtime: 'automatic' }]
            ],
          },
        },
      },
      {
        // CSS file processing
        test: /\.css$/i,
        use: [
          'style-loader', // Injects CSS into DOM
          'css-loader',   // Processes CSS imports and url() references
        ],
      },
      {
        // Asset file processing (images, fonts, etc.)
        test: /\.(png|svg|jpg|jpeg|gif|ico)$/i,
        type: 'asset/resource',
        generator: {
          filename: 'assets/[name][ext]',
        },
      },
    ],
  },

  // File extension resolution
  resolve: {
    extensions: ['.js', '.jsx', '.ts', '.tsx'],
    
    // Fallbacks for Node.js modules that aren't available in browser
    fallback: {
      "crypto": false,
      "stream": false,
      "util": false,
      "buffer": false,
    },
  },

  // Webpack plugins for additional functionality
  plugins: [
    // Generate HTML file for popup interface
    new HtmlWebpackPlugin({
      template: './public/index.html',
      filename: 'index.html',
      chunks: ['popup'], // Only include popup bundle in this HTML
      inject: 'body',
      minify: {
        removeComments: true,
        collapseWhitespace: true,
        removeRedundantAttributes: true,
        useShortDoctype: true,
      },
    }),

    // Copy static assets that don't need processing
    new CopyWebpackPlugin({
      patterns: [
        {
          from: 'public/manifest.json',
          to: 'manifest.json',
          // Transform manifest to inject environment variables if needed
          transform(content) {
            const manifest = JSON.parse(content.toString());
            // Could add dynamic version or other build-time values here
            return JSON.stringify(manifest, null, 2);
          },
        },
        
        // Extension icons
        { from: 'public/logo192.png', to: 'logo192.png' },
        { from: 'public/logo512.png', to: 'logo512.png' },
        { from: 'public/favicon.ico', to: 'favicon.ico' },
        
        // Math rendering assets
        { from: 'public/sandbox.html', to: 'sandbox.html' },
        { from: 'public/mathjax-handler.js', to: 'mathjax-handler.js' },
        { from: 'public/tex-chtml.js', to: 'tex-chtml.js' },
        
        // Additional assets if they exist
        { from: 'public/imgs', to: 'imgs', noErrorOnMissing: true },
        { from: 'public/vendor', to: 'vendor', noErrorOnMissing: true },
      ],
    }),

    // Provide global variables for older libraries
    new webpack.ProvidePlugin({
      React: 'react',
      // Make createRoot globally available for dynamic rendering
      createRoot: ['react-dom/client', 'createRoot'],
    }),

    // Inject environment variables into the bundle
    new webpack.DefinePlugin({
      // Make environment variables available to the extension code
      'process.env.EXTENSION_SECRET': JSON.stringify(process.env.EXTENSION_SECRET),
      'process.env.BASE_URL': JSON.stringify(process.env.BASE_URL),
      'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'production'),
      
      // Define global for extension environment
      'process.env.IS_EXTENSION': JSON.stringify(true),
    }),

    // Bundle analyzer plugin (uncomment for bundle size analysis)
    // new (require('webpack-bundle-analyzer').BundleAnalyzerPlugin)({
    //   analyzerMode: 'static',
    //   openAnalyzer: false,
    // }),
  ],

  // Build mode configuration
  mode: process.env.NODE_ENV === 'development' ? 'development' : 'production',

  // Development tools configuration
  devtool: process.env.NODE_ENV === 'development' ? 'cheap-module-source-map' : false,

  // Optimization settings
  optimization: {
    // Don't split chunks for extension - keep each entry point as single file
    splitChunks: {
      chunks: 'async', // Only split async chunks, keep entry points intact
      cacheGroups: {
        vendor: {
          test: /[\\/]node_modules[\\/]/,
          name: 'vendor',
          chunks: 'async',
          priority: 10,
          reuseExistingChunk: true,
        },
      },
    },
    
    // Minimize in production
    minimize: process.env.NODE_ENV !== 'development',
    
    // Use deterministic module IDs for better caching
    moduleIds: 'deterministic',
  },

  // Performance hints configuration
  performance: {
    // Set higher limits for extension bundles
    maxAssetSize: 1000000, // 1MB
    maxEntrypointSize: 1000000, // 1MB
    
    // Only warn in development
    hints: process.env.NODE_ENV === 'development' ? 'warning' : false,
  },

  // External dependencies that shouldn't be bundled
  externals: {
    // Chrome extension APIs are provided by the browser
    'chrome': 'chrome',
  },

  // Stats configuration for build output
  stats: {
    colors: true,
    modules: false,
    children: false,
    chunks: false,
    chunkModules: false,
  },
};
