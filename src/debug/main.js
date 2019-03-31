void (async function() {
  // Load settings and set theme
  let ans = await browser.storage.local.get('settings')
  let settings = ans.settings
  let theme = settings ? settings.theme : 'dark'
  const rootEl = document.getElementById('root')
  rootEl.classList.add('-' + theme)

  const url = new URL(window.location)
  const settingsEl = document.getElementById('settings')
  const settingsData = url.searchParams.get('settings')
  settingsEl.innerText = settingsData

  const panelsEl = document.getElementById('panels')
  const panelsData = url.searchParams.get('panels')
  panelsEl.innerText = panelsData

  const tabsEl = document.getElementById('tabs')
  const tabsData = url.searchParams.get('tabs')
  tabsEl.innerText = tabsData

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
