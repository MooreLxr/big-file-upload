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
  }
}
