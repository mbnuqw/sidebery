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

const PERM_URL = scripts['dev.perm.url'].split(' ')
const PERM_URL_CMD = PERM_URL[0]
const PERM_URL_OPT = PERM_URL.slice(1)

const PERM_HIDE = scripts['dev.perm.hide'].split(' ')
const PERM_HIDE_CMD = PERM_HIDE[0]
const PERM_HIDE_OPT = PERM_HIDE.slice(1)

const DBG = scripts['dev.debug'].split(' ')
const DBG_CMD = DBG[0]
const DBG_OPT = DBG.slice(1)

const SETTINGS = scripts['dev.settings'].split(' ')
const SETTINGS_CMD = SETTINGS[0]
const SETTINGS_OPT = SETTINGS.slice(1)

const MENU = scripts['dev.menu'].split(' ')
const MENU_CMD = MENU[0]
const MENU_OPT = MENU.slice(1)

const EXT = scripts['dev.ext.' + VER].split(' ')
const EXT_CMD = EXT[0]
const EXT_OPT = EXT.slice(1)

const EXEC_CONFIG = { env: process.env }

let out = spawnSync(CLEAR_SIDEBAR_CMD, CLEAR_SIDEBAR_OPT, EXEC_CONFIG)
if (out.status) process.exit(out.status)
const Sidebar = spawn(SIDEBAR_CMD, SIDEBAR_OPT, EXEC_CONFIG)
const Group = spawn(GROUP_CMD, GROUP_OPT, EXEC_CONFIG)
const PermUrl = spawn(PERM_URL_CMD, PERM_URL_OPT, EXEC_CONFIG)
const PermHide = spawn(PERM_HIDE_CMD, PERM_HIDE_OPT, EXEC_CONFIG)
const Debug = spawn(DBG_CMD, DBG_OPT, EXEC_CONFIG)
const Settings = spawn(SETTINGS_CMD, SETTINGS_OPT, EXEC_CONFIG)
const Menu = spawn(MENU_CMD, MENU_OPT, EXEC_CONFIG)
const Ext = spawn(EXT_CMD, EXT_OPT, EXEC_CONFIG)

Sidebar.stdout.on('data', data => logOut('[Sidebar] ', data))
Sidebar.stderr.on('data', data => errOut('[Sidebar ERROR] ', data))
Group.stdout.on('data', data => logOut('[Group] ', data))
Group.stderr.on('data', data => errOut('[Group ERROR] ', data))
PermUrl.stdout.on('data', data => logOut('[PermUrl] ', data))
PermUrl.stderr.on('data', data => errOut('[PermUrl ERROR] ', data))
PermHide.stdout.on('data', data => logOut('[PermHide] ', data))
PermHide.stderr.on('data', data => errOut('[PermHide ERROR] ', data))
Debug.stdout.on('data', data => logOut('[Debug] ', data))
Debug.stderr.on('data', data => errOut('[Debug ERROR] ', data))
Settings.stdout.on('data', data => logOut('[Settings] ', data))
Settings.stderr.on('data', data => errOut('[Settings ERROR] ', data))
Menu.stdout.on('data', data => logOut('[Menu] ', data))
Menu.stderr.on('data', data => errOut('[Menu ERROR] ', data))
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
