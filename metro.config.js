const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Production optimizations
if (process.env.NODE_ENV === 'production') {
  config.transformer.minifierConfig = {
    // Optimize bundle size
    keep_classnames: false,
    keep_fnames: false,
    mangle: {
      keep_classnames: false,
      keep_fnames: false,
    },
    compress: {
      drop_console: true, // Remove console.log in production
      drop_debugger: true,
    }
  };
}

module.exports = config;
