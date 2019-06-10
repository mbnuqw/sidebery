/*global process, require:true*/
/*eslint no-console: off*/
const { spawn, spawnSync } = require('child_process')
const { scripts } = require('../package.json')
const VER = process.argv[process.argv.length - 1]

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

const GROUP = scripts['dev.group'].split(' ')
const GROUP_CMD = GROUP[0]
const GROUP_OPT = GROUP.slice(1)

const DBG = scripts['dev.debug'].split(' ')
const DBG_CMD = DBG[0]
const DBG_OPT = DBG.slice(1)

const SETTINGS = scripts['dev.settings'].split(' ')
const SETTINGS_CMD = SETTINGS[0]
const SETTINGS_OPT = SETTINGS.slice(1)

const MENU = scripts['dev.menu'].split(' ')
const MENU_CMD = MENU[0]
const MENU_OPT = MENU.slice(1)

const STYLES = scripts['dev.styles'].split(' ')
const STYLES_CMD = STYLES[0]
const STYLES_OPT = STYLES.slice(1)

const THEME = scripts['dev.theme'].split(' ')
const THEME_CMD = THEME[0]
const THEME_OPT = THEME.slice(1)

const SNAPSHOTS = scripts['dev.snapshots'].split(' ')
const SNAPSHOTS_CMD = SNAPSHOTS[0]
const SNAPSHOTS_OPT = SNAPSHOTS.slice(1)

const EXT = scripts['dev.ext.' + VER].split(' ')
const EXT_CMD = EXT[0]
const EXT_OPT = EXT.slice(1)

const EXEC_CONFIG = { env: process.env }

let out = spawnSync(CLEAR_SIDEBAR_CMD, CLEAR_SIDEBAR_OPT, EXEC_CONFIG)
if (out.status) process.exit(out.status)

const Sidebar = spawn(SIDEBAR_CMD, SIDEBAR_OPT, EXEC_CONFIG)
Sidebar.stdout.on('data', data => logOut('[Sidebar] ', data))
Sidebar.stderr.on('data', data => errOut('[Sidebar ERROR] ', data))

// const Group = spawn(GROUP_CMD, GROUP_OPT, EXEC_CONFIG)
// Group.stdout.on('data', data => logOut('[Group] ', data))
// Group.stderr.on('data', data => errOut('[Group ERROR] ', data))

const Debug = spawn(DBG_CMD, DBG_OPT, EXEC_CONFIG)
Debug.stdout.on('data', data => logOut('[Debug] ', data))
Debug.stderr.on('data', data => errOut('[Debug ERROR] ', data))

const Settings = spawn(SETTINGS_CMD, SETTINGS_OPT, EXEC_CONFIG)
Settings.stdout.on('data', data => logOut('[Settings] ', data))
Settings.stderr.on('data', data => errOut('[Settings ERROR] ', data))

// const Menu = spawn(MENU_CMD, MENU_OPT, EXEC_CONFIG)
// Menu.stdout.on('data', data => logOut('[Menu] ', data))
// Menu.stderr.on('data', data => errOut('[Menu ERROR] ', data))

const Styles = spawn(STYLES_CMD, STYLES_OPT, EXEC_CONFIG)
Styles.stdout.on('data', data => logOut('[Styles] ', data))
Styles.stderr.on('data', data => errOut('[Styles ERROR] ', data))

const Theme = spawn(THEME_CMD, THEME_OPT, EXEC_CONFIG)
Theme.stdout.on('data', data => logOut('[Theme] ', data))
Theme.stderr.on('data', data => errOut('[Theme ERROR] ', data))

// const Snapshots = spawn(SNAPSHOTS_CMD, SNAPSHOTS_OPT, EXEC_CONFIG)
// Snapshots.stdout.on('data', data => logOut('[Snapshots] ', data))
// Snapshots.stderr.on('data', data => errOut('[Snapshots ERROR] ', data))

const Ext = spawn(EXT_CMD, EXT_OPT, EXEC_CONFIG)

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
