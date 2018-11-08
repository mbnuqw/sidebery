/*global process, require:true*/
/*eslint no-console: off*/
const { spawn, spawnSync } = require('child_process')
const { scripts } = require('../package.json')
const LANG = process.argv[process.argv.length - 1]

const colors = {
  reset: '\x1b[0m',
  white: str => `\x1b[37m${str}\x1b[0m`,
  grey: str => `\x1b[90m${str}\x1b[0m`,
  red: str => `\x1b[31m${str}\x1b[0m`,
  yellow: str => `\x1b[33m${str}\x1b[0m`,
  green: str => `\x1b[32m${str}\x1b[0m`,
  blue: str => `\x1b[34m${str}\x1b[0m`,
  magenta: str => `\x1b[35m${str}\x1b[0m`,
  cyan: str => `\x1b[36m${str}\x1b[0m`,
}

const CLEAR_SIDEBAR = scripts['clear.sidebar'].split(' ')
const CLEAR_SIDEBAR_CMD = CLEAR_SIDEBAR[0]
const CLEAR_SIDEBAR_OPT = CLEAR_SIDEBAR.slice(1)

const SIDEBAR = scripts['dev.sidebar'].split(' ')
const SIDEBAR_CMD = SIDEBAR[0]
const SIDEBAR_OPT = SIDEBAR.slice(1)

const EXT = scripts['dev.ext.' + LANG].split(' ')
const EXT_CMD = EXT[0]
const EXT_OPT = EXT.slice(1)

const EXEC_CONFIG = { env: process.env }

let out = spawnSync(CLEAR_SIDEBAR_CMD, CLEAR_SIDEBAR_OPT, EXEC_CONFIG)
if (out.status) process.exit(out.status)
const Sidebar = spawn(SIDEBAR_CMD, SIDEBAR_OPT, EXEC_CONFIG)
const Ext = spawn(EXT_CMD, EXT_OPT, EXEC_CONFIG)

Sidebar.stdout.on('data', data => logOut('[Sidebar] ', data))
Sidebar.stderr.on('data', data => errOut('[Sidebar ERROR] ', data))
Ext.stdout.on('data', data => logOut('[Ext]     ', data))

function logOut(prefix, data) {
  data
    .toString()
    .split('\n')
    .map(line => {
      if (!line) return
      console.log(prefix, line)
    })
}

function errOut(prefix, data) {
  data
    .toString()
    .split('\n')
    .map(line => {
      if (!line) return
      console.log(colors.red(prefix), line)
    })
}
