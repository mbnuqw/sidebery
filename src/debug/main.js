void (async function() {
  // Load settings and set theme
  let ans = await browser.storage.local.get('settings')
  let settings = ans.settings
  let theme = settings ? settings.theme : 'dark'
  const rootEl = document.getElementById('root')
  rootEl.classList.add('-' + theme)

  const url = new URL(window.location)
  const data = url.searchParams.get('data')
  const dataEl = document.getElementById('data')
  dataEl.innerText = data

  dataEl.addEventListener('click', () => {
    const selection = window.getSelection()
    const range = new window.Range()
    range.selectNode(dataEl)
    selection.addRange(range)
  })
})()
