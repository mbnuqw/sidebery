/*eslint no-console: off*/
const { spawnSync } = require('child_process')
const { scripts } = require('../package.json')

const TESTS = scripts['test'].split(' ')
const TESTS_CMD = TESTS[0]
const TESTS_OPT = TESTS.slice(1)

const CLEAR_CACHE = scripts['clear.cache'].split(' ')
const CLEAR_CACHE_CMD = CLEAR_CACHE[0]
const CLEAR_CACHE_OPT = CLEAR_CACHE.slice(1)

const CLEAR_SIDEBAR = scripts['clear.sidebar'].split(' ')
const CLEAR_SIDEBAR_CMD = CLEAR_SIDEBAR[0]
const CLEAR_SIDEBAR_OPT = CLEAR_SIDEBAR.slice(1)

const CLEAR_GROUP = scripts['clear.group'].split(' ')
const CLEAR_GROUP_CMD = CLEAR_GROUP[0]
const CLEAR_GROUP_OPT = CLEAR_GROUP.slice(1)

const CLEAR_PERM = scripts['clear.permissions'].split(' ')
const CLEAR_PERM_CMD = CLEAR_PERM[0]
const CLEAR_PERM_OPT = CLEAR_PERM.slice(1)

const CLEAR_DBG = scripts['clear.debug'].split(' ')
const CLEAR_DBG_CMD = CLEAR_DBG[0]
const CLEAR_DBG_OPT = CLEAR_DBG.slice(1)

const SIDEBAR = scripts['build.sidebar'].split(' ')
const SIDEBAR_CMD = SIDEBAR[0]
const SIDEBAR_OPT = SIDEBAR.slice(1)

const GROUP = scripts['build.group'].split(' ')
const GROUP_CMD = GROUP[0]
const GROUP_OPT = GROUP.slice(1)

const PERM_URL = scripts['build.perm.url'].split(' ')
const PERM_URL_CMD = PERM_URL[0]
const PERM_URL_OPT = PERM_URL.slice(1)

const PERM_HIDE = scripts['build.perm.hide'].split(' ')
const PERM_HIDE_CMD = PERM_HIDE[0]
const PERM_HIDE_OPT = PERM_HIDE.slice(1)

const DBG = scripts['build.debug'].split(' ')
const DBG_CMD = DBG[0]
const DBG_OPT = DBG.slice(1)

const SETTINGS = scripts['build.settings'].split(' ')
const SETTINGS_CMD = SETTINGS[0]
const SETTINGS_OPT = SETTINGS.slice(1)

const MENU = scripts['build.menu'].split(' ')
const MENU_CMD = MENU[0]
const MENU_OPT = MENU.slice(1)

const STYLES = scripts['build.styles'].split(' ')
const STYLES_CMD = STYLES[0]
const STYLES_OPT = STYLES.slice(1)

const EXT = scripts['build.ext'].split(' ')
const EXT_CMD = EXT[0]
const EXT_OPT = EXT.slice(1)

const EXEC_CONFIG = { env: process.env, stdio: 'inherit' }

let out = spawnSync(TESTS_CMD, TESTS_OPT, EXEC_CONFIG)
if (out.status) process.exit(out.status)

out = spawnSync(CLEAR_CACHE_CMD, CLEAR_CACHE_OPT, EXEC_CONFIG)
if (out.status) process.exit(out.status)
out = spawnSync(CLEAR_SIDEBAR_CMD, CLEAR_SIDEBAR_OPT, EXEC_CONFIG)
if (out.status) process.exit(out.status)
out = spawnSync(CLEAR_GROUP_CMD, CLEAR_GROUP_OPT, EXEC_CONFIG)
if (out.status) process.exit(out.status)
out = spawnSync(CLEAR_PERM_CMD, CLEAR_PERM_OPT, EXEC_CONFIG)
if (out.status) process.exit(out.status)
out = spawnSync(CLEAR_DBG_CMD, CLEAR_DBG_OPT, EXEC_CONFIG)
if (out.status) process.exit(out.status)
out = spawnSync(SIDEBAR_CMD, SIDEBAR_OPT, EXEC_CONFIG)
if (out.status) process.exit(out.status)
out = spawnSync(GROUP_CMD, GROUP_OPT, EXEC_CONFIG)
if (out.status) process.exit(out.status)
out = spawnSync(PERM_URL_CMD, PERM_URL_OPT, EXEC_CONFIG)
if (out.status) process.exit(out.status)
out = spawnSync(PERM_HIDE_CMD, PERM_HIDE_OPT, EXEC_CONFIG)
if (out.status) process.exit(out.status)
out = spawnSync(DBG_CMD, DBG_OPT, EXEC_CONFIG)
if (out.status) process.exit(out.status)
out = spawnSync(SETTINGS_CMD, SETTINGS_OPT, EXEC_CONFIG)
if (out.status) process.exit(out.status)
out = spawnSync(MENU_CMD, MENU_OPT, EXEC_CONFIG)
if (out.status) process.exit(out.status)
out = spawnSync(STYLES_CMD, STYLES_OPT, EXEC_CONFIG)
if (out.status) process.exit(out.status)
out = spawnSync(EXT_CMD, EXT_OPT, EXEC_CONFIG)
if (out.status) process.exit(out.status)
