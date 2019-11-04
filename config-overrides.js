const path = require('path')

module.exports = {
  webpack: function (config, env) {
    config.resolve = {
      alias: {
        '@': path.resolve(__dirname, 'src'),
        'pages': path.resolve(__dirname, 'src/pages'),
        'components': path.resolve(__dirname, 'src/components'),
        'images': path.resolve(__dirname, 'src/images'),
        'styles': path.resolve(__dirname, 'src/styles')
      }
    }
    return config
  },
  devServer: function (configFunction) {
    return function (proxy, allowedHost) {
      const config = configFunction(proxy, allowedHost)
      const fs = require('fs')
      return config
    }
  },
  paths: function (paths, env) {
    return paths
  }
}
