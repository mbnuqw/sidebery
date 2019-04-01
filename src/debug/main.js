void (async function() {
  // Load settings and set theme
  let ans = await browser.storage.local.get('settings')
  let settings = ans.settings
  let theme = settings ? settings.theme : 'dark'
  const rootEl = document.getElementById('root')
  rootEl.classList.add('-' + theme)

  // Wait for the info
  const win = await browser.windows.getCurrent()
  const info = await browser.runtime.sendMessage({
    action: 'getDbgInfo',
    windowId: win.id,
  })

  if (!info) return

  const settingsEl = document.getElementById('settings')
  const panelsEl = document.getElementById('panels')
  const tabsEl = document.getElementById('tabs')

  settingsEl.innerText = JSON.stringify(info.settings, null, '   ')
  panelsEl.innerText = JSON.stringify(info.panels, null, '   ')
  tabsEl.innerText = JSON.stringify(info.tabs, null, '   ')

  settingsEl.addEventListener('click', () => {
    const selection = window.getSelection()
    const range = new window.Range()
    range.selectNode(settingsEl)
    selection.addRange(range)
  })

  panelsEl.addEventListener('click', () => {
    const selection = window.getSelection()
    const range = new window.Range()
    range.selectNode(panelsEl)
    selection.addRange(range)
  })

  tabsEl.addEventListener('click', () => {
    const selection = window.getSelection()
    const range = new window.Range()
    range.selectNode(tabsEl)
    selection.addRange(range)
  })
})()
