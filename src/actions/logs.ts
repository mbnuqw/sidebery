interface ActionContextTEMP {
  actions: { [key: string]: (...args: any[]) => any }
  state: {
    instanceType: string
    bg: WEPort
    windowId: string
  }

  _logs: string[] | undefined
  _logTimeout: number | undefined
}

enum LogLvl {
  Info = 'INFO',
  Warn = 'WARN',
  Err = 'ERR',
}

/**
 * Log info
 */
function infoLog(this: ActionContextTEMP, msg: string): void {
  this.actions.log(LogLvl.Info, msg)
}

/**
 * Log warn
 */
function warnLog(this: ActionContextTEMP, msg: string): void {
  this.actions.log(LogLvl.Warn, msg)
}

/**
 * Log err
 */
function errLog(this: ActionContextTEMP, msg: string): void {
  this.actions.log(LogLvl.Err, msg)
}

/**
 * Log msg at given level in mem and send
 */
const LOG_DEBOUNCE = 1000
function log(this: ActionContextTEMP, lvl: LogLvl, msg: string): void {
  if (!this._logs) this._logs = []
  const log = `${Date.now()} [${lvl}::${this.state.instanceType}-${this.state.windowId}] ${msg}`
  this._logs.push(log)

  if (this._logTimeout) window.clearTimeout(this._logTimeout)
  this._logTimeout = setTimeout(() => {
    if (this.state.bg && !this.state.bg.error) {
      this.state.bg.postMessage({ action: 'log', args: [this._logs] })
    } else {
      browser.runtime.sendMessage({ instanceType: 'bg', action: 'log', args: [this._logs] })
    }
    this._logs = []
  }, LOG_DEBOUNCE)
}

export default {
  infoLog,
  warnLog,
  errLog,
  log,
}
