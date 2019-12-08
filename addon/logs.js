/* eslint no-console: off */

let prefix = ''
let spaceTimeout

export function initLogs(instance) {
  prefix = '[' + instance.toUpperCase() + ']'
}

export function log(...args) {
  console.log(prefix, ...args)

  if (spaceTimeout) clearTimeout(spaceTimeout)
  spaceTimeout = setTimeout(() => {
    spaceTimeout = null
    console.log(' ')
  }, 1000)
}