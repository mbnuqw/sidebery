void (async function() {
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
      const tabEl = createTabEl(info)
      tabsBoxEl.appendChild(tabEl)

      // Set click listeners
      tabEl.addEventListener('click', async () => {
        await browser.runtime.sendMessage({
          action: 'expTabsBranch',
          arg: groupInfo.id,
        })
        browser.tabs.update(info.id, { active: true })
      })
    }
  }
})()

/**
 * Create tab element
 */
function createTabEl(info) {
  const el = document.createElement('div')
  el.classList.add('tab-wrapper')

  const tabEl = document.createElement('div')
  tabEl.classList.add('tab')

  if (info.screen) {
    const bgEl = document.createElement('div')
    bgEl.classList.add('bg')
    if (info.screen) {
      bgEl.style.backgroundImage = `url(${info.screen})`
    }
    tabEl.appendChild(bgEl)
  }

  const titleEl = document.createElement('h3')
  titleEl.innerText = info.title
  tabEl.appendChild(titleEl)

  const urlEl = document.createElement('p')
  urlEl.classList.add('url')
  urlEl.innerText = info.url
  tabEl.appendChild(urlEl)

  el.appendChild(tabEl)
  return el
}