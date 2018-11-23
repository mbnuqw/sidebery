/*global process:true*/
/*eslint no-console: off*/
function D(...args) {
  if (process.env.NODE_ENV === 'development') console.log('[DEBUG]', ...args)
}

function E(msg, err) {
  if (process.env.NODE_ENV === 'development') console.error(`[ERROR] ${msg}`, err)
}

export default { D, E }
