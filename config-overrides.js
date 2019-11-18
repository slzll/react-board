const path = require('path')

const isDev = process.env.NODE_ENV === 'development'

process.env.PUBLIC_URL = isDev ? '' : '/board'

module.exports = {
  webpack: function (config, env) {
    config.output.publicPath = isDev ? '' : '/board'
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
