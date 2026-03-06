const CompressionPlugin = require('compression-webpack-plugin');
const webpack = require('webpack');

module.exports = {
  devServer: {
    // Send Permissions-Policy as a real HTTP header so Chrome respects it.
    // The meta http-equiv approach does NOT work for Permissions-Policy.
    headers: {
      'Permissions-Policy': 'unload=*',
    },
  },
  webpack: {
    plugins: {
      add: process.env.NODE_ENV === 'production' ? [
        // Gzip compression (only in production)
        new CompressionPlugin({
          filename: '[path][base].gz',
          algorithm: 'gzip',
          test: /\.(js|css|html|svg)$/,
          threshold: 10240, // Only compress files > 10KB
          minRatio: 0.8,
        }),
        // Brotli compression (better than gzip, only in production)
        new CompressionPlugin({
          filename: '[path][base].br',
          algorithm: 'brotliCompress',
          test: /\.(js|css|html|svg)$/,
          compressionOptions: {
            level: 11,
          },
          threshold: 10240, // Only compress files > 10KB
          minRatio: 0.8,
        }),
      ] : [],
    },
    configure: (webpackConfig) => {
      // Vendor bundle splitting
      webpackConfig.optimization = {
        ...webpackConfig.optimization,
        splitChunks: {
          chunks: 'all',
          cacheGroups: {
            // Separate vendor bundle
            vendor: {
              test: /[\\/]node_modules[\\/]/,
              name: 'vendors',
              priority: 10,
              reuseExistingChunk: true,
            },
            // React and React-DOM together
            react: {
              test: /[\\/]node_modules[\\/](react|react-dom|react-router-dom)[\\/]/,
              name: 'react-vendor',
              priority: 20,
              reuseExistingChunk: true,
            },
            // Bootstrap and React-Bootstrap
            bootstrap: {
              test: /[\\/]node_modules[\\/](bootstrap|react-bootstrap)[\\/]/,
              name: 'bootstrap-vendor',
              priority: 15,
              reuseExistingChunk: true,
            },
            // React Query
            reactQuery: {
              test: /[\\/]node_modules[\\/]@tanstack[\\/]/,
              name: 'react-query-vendor',
              priority: 15,
              reuseExistingChunk: true,
            },
            // Common components
            common: {
              minChunks: 2,
              priority: 5,
              reuseExistingChunk: true,
            },
          },
        },
      };

      // Tree shaking optimization
      webpackConfig.optimization.usedExports = true;
      
      return webpackConfig;
    },
  },
};
