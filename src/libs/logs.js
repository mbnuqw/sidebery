/*global process:true*/
/*eslint no-console: off*/
const Logs = []
let ts = 0

const LOGS_CAPACITY = 256

function D(...args) {
  let now = Date.now()
  if (Logs.length > LOGS_CAPACITY) Logs.splice(0, 16)
  Logs.push({ msg: args, t: now - ts })
  ts = now
  if (process.env.NODE_ENV === 'development') console.log('[DEBUG]', ...args)
}

function E(msg, err) {
  let now = Date.now()
  if (Logs.length > LOGS_CAPACITY) Logs.splice(0, 16)
  Logs.push({ err: err.toString(), msg, t: now - ts })
  ts = now
  if (process.env.NODE_ENV === 'development') console.error(`[ERROR] ${msg}`, err)
}

function GetJSON() {
  return JSON.stringify(Logs, null, 2)
}

export default { GetJSON, D, E }
