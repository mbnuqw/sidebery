/**
 * Log info
 */
function infoLog(msg) {
  if (!this._logs) this._logs = []
  this._logs.push(`${Date.now()} [INFO::background] ${msg}`)
}

/**
 * Log warn
 */
function warnLog(msg) {
  if (!this._logs) this._logs = []
  this._logs.push(`${Date.now()} [WARN::background] ${msg}`)
}

/**
 * Log err
 */
function errLog(msg) {
  if (!this._logs) this._logs = []
  this._logs.push(`${Date.now()} [ERR::background] ${msg}`)
}

/**
 * Writes logs
 */
function log(logs) {
  if (!this._logs) this._logs = []
  this._logs.push(...logs)

  if (this._logs.length > 123) {
    browser.storage.local.set({ logs: this._logs })
    this._logs = []
  }
}

/**
 * Returns all logs
 */
async function getLogs() {
  let storage = { logs: [] }
  try {
    storage = await browser.storage.local.get(storage)
  } catch (err) {
    // ...
  }

  let logs = storage.logs

  if (this._logs) logs = logs.concat(this._logs)

  return logs
}

function initLogs() {
  window.getLogs = this.actions.getLogs
}

export default {
  infoLog,
  warnLog,
  errLog,
  log,
  getLogs,
  initLogs,
}
