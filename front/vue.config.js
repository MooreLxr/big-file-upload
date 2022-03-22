/** @type {import('@vue/cli-service').ProjectOptions} */
const path = require('path')
module.exports = {
  runtimeCompiler: true,
  lintOnSave: true,
  configureWebpack: {
    resolve: {
      alias: {
        '@': path.join(__dirname, 'src'),
        'vue$': 'vue/dist/vue.esm.js'
      },
      extensions: ['*', '.js', '.vue', '.json']
    }
  },
  // 用于开发环境下与后端联调
  devServer: {
    // port: 8080, // 端口号
    // host: 'localhost',
    // https: false,
    // open: true, //配置自动启动浏览器
    proxy: {
      '^/api/': {
        target: 'http://10.193.20.111:3000',
        changeOrigin: true,
        pathRewrite: {
          '^/api/': ''
        }
      }
    }
  }
}
