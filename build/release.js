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

const SIDEBAR = scripts['build.sidebar'].split(' ')
const SIDEBAR_CMD = SIDEBAR[0]
const SIDEBAR_OPT = SIDEBAR.slice(1)

const EXT = scripts['build.ext'].split(' ')
const EXT_CMD = EXT[0]
const EXT_OPT = EXT.slice(1)

const EXEC_CONFIG = { env: process.env, stdio: 'inherit' }

let out = spawnSync(TESTS_CMD, TESTS_OPT, EXEC_CONFIG)
if (out.status) process.exit(out.status)
console.log('\n')
out = spawnSync(CLEAR_CACHE_CMD, CLEAR_CACHE_OPT, EXEC_CONFIG)
if (out.status) process.exit(out.status)
console.log('\n')
out = spawnSync(CLEAR_SIDEBAR_CMD, CLEAR_SIDEBAR_OPT, EXEC_CONFIG)
if (out.status) process.exit(out.status)
console.log('\n')
out = spawnSync(SIDEBAR_CMD, SIDEBAR_OPT, EXEC_CONFIG)
if (out.status) process.exit(out.status)
console.log('\n')
out = spawnSync(EXT_CMD, EXT_OPT, EXEC_CONFIG)
if (out.status) process.exit(out.status)