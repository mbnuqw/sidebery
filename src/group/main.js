void (async function() {
  // Load settings and set theme
  let ans = await browser.storage.local.get('settings')
  let settings = ans.settings
  let theme = settings ? settings.theme : 'dark'
  const rootEl = document.getElementById('root')
  rootEl.classList.add('-' + theme)

  // Set title of group page
  const title = decodeURI(window.location.hash.slice(1))
  const titleEl = document.getElementById('title')
  titleEl.value = title
  document.title = title

  // Listen chagnes of title
  titleEl.addEventListener('input', e => {
    document.title = e.target.value
    window.location.hash = '#' + encodeURI(e.target.value)
  })

  // Get list of tabs
  const groupInfo = await browser.runtime.sendMessage({
    action: 'getGroupInfo',
    arg: title,
  })

  // Render tabs
  if (groupInfo && groupInfo.tabs) {
    const tabsBoxEl = document.getElementById('tabs')
    for (let info of groupInfo.tabs) {
      info.el = createTabEl(info)
      tabsBoxEl.appendChild(info.el)

      // Set click listeners
      info.el.addEventListener('click', async () => {
        await browser.runtime.sendMessage({
          action: 'expTabsBranch',
          arg: groupInfo.id,
        })
        browser.tabs.update(info.id, { active: true })
      })
    }
  }

  // Load screens
  loadScreens(groupInfo.tabs)
})()

/**
 * Create tab element
 */
function createTabEl(info) {
  const el = document.createElement('div')
  el.classList.add('tab-wrapper')
  el.title = info.url

  info.tabEl = document.createElement('div')
  info.tabEl.classList.add('tab')

  info.bgEl = document.createElement('div')
  info.bgEl.classList.add('bg')
  info.tabEl.appendChild(info.bgEl)

  const infoEl = document.createElement('div')
  infoEl.classList.add('info')
  info.tabEl.appendChild(infoEl)

  const titleEl = document.createElement('h3')
  titleEl.innerText = info.title
  infoEl.appendChild(titleEl)

  const urlEl = document.createElement('p')
  urlEl.classList.add('url')
  urlEl.innerText = info.url
  infoEl.appendChild(urlEl)

  el.appendChild(info.tabEl)
  return el
}

/**
 * Load screenshots
 */
function loadScreens(tabs) {
  for (let tab of tabs) {
    if (tab.discarded) {
      tab.tabEl.classList.add('-discarded')
      tab.bgEl.style.backgroundImage = `url(${tab.favIconUrl})`
      tab.bgEl.style.backgroundPosition = 'center'
      tab.bgEl.style.filter = 'blur(32px)'
      continue
    }

    // Set loading start
    browser.tabs.captureTab(tab.id, { format: 'jpeg', quality: 90 })
      .then(screen => {
        tab.bgEl.style.backgroundImage = `url(${screen})`
      })
  }
}