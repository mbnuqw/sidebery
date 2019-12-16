const process = require('process')
const fs = require('fs')
const MODE = process.argv[process.argv.length - 1]

if (MODE === 'dev') {
  fs.copyFileSync('./node_modules/vue/dist/vue.esm.browser.js', './addon/vendor/vue.js')
  fs.copyFileSync('./node_modules/vuex/dist/vuex.esm.browser.js', './addon/vendor/vuex.js')
}

if (MODE === 'build') {
  fs.copyFileSync('./node_modules/vue/dist/vue.esm.browser.min.js', './addon/vendor/vue.js')
  fs.copyFileSync('./node_modules/vuex/dist/vuex.esm.browser.min.js', './addon/vendor/vuex.js')
}
