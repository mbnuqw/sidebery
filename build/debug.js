/*global process, require:true*/
/*eslint no-console: off*/
const { spawn, spawnSync } = require('child_process')
const { scripts } = require('../package.json')
const LANG = process.argv[process.argv.length - 1]

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
