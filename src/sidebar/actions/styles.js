export default {
  updateStyles({ state }) {
    const rootEl = document.getElementById('root')
    for (let key in state.customTheme) {
      if (!state.customTheme.hasOwnProperty(key)) continue
      let varName = '--' + key.replace('_', '-')
      rootEl.style.setProperty(varName, state.customTheme[key])
    }
  }
}