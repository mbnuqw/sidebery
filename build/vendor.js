const process = require('process')
const fs = require('fs')
const MODE = process.argv[process.argv.length - 1]

if (MODE === 'dev') {
  fs.copyFileSync('./node_modules/vue/dist/vue.js', './addon/vendor/vue.min.js')
  fs.copyFileSync('./node_modules/vuex/dist/vuex.js', './addon/vendor/vuex.min.js')
}

if (MODE === 'build') {
  fs.copyFileSync('./node_modules/vue/dist/vue.min.js', './addon/vendor/vue.min.js')
  fs.copyFileSync('./node_modules/vuex/dist/vuex.min.js', './addon/vendor/vuex.min.js')
}
