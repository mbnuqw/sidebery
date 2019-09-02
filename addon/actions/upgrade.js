import Actions from '../actions.js'

/**
 * Compare previous and current versions of addon and
 * if they differ run upgrade action
 */
async function checkVersion(settings) {
  if (!settings) return
  if (!settings.version) return await Actions.upgradeToV3(settings)
}

/**
 * Upgrade stored values to version 3.x.x
 */
async function upgradeToV3(settings) {
  // --- Settings ---
  settings.version = browser.runtime.getManifest().version
  if (['dark', 'light'].includes(settings.theme)) {
    settings.style = settings.theme
    settings.theme = 'default'
  }
  if (settings.rmFoldedTabs) {
    settings.rmChildTabs = 'folded'
    delete settings.rmFoldedTabs
  }
  delete settings.snapshotsTargets

  // --- Custom CSS vars ---
  let { styles } = await browser.storage.local.get({ styles: null })
  if (styles) {
    await browser.storage.local.set({ cssVars: styles })
    await browser.storage.local.remove('styles')
  }

  // --- Favicons ---
  let { favicons } = await browser.storage.local.get({ favicons: null })
  if (favicons && !Array.isArray(favicons)) {
    let newFavicons = []
    let favUrls = {}
    let tabs = await browser.tabs.query({})
    let urlsInUse = tabs.map(t => t.url)
    let bookmarks = await browser.bookmarks.getTree()
    
    let walker = nodes => {
      for (let n of nodes) {
        if (n.type === 'bookmark') urlsInUse.push(n.url)
        if (n.children) walker(n.children)
      }
    }
    walker(bookmarks[0].children)

    let favHosts = Object.keys(favicons)
    for (let url of urlsInUse) {
      if (!url) continue
      for (let favHost of favHosts) {
        if (!favHost) continue
        let host = url.split('/')[2] || ''
        if (host === favHost) {
          let index = newFavicons.indexOf(favicons[favHost])
          if (index === -1) index = newFavicons.push(favicons[favHost]) - 1
          favUrls[url] = index
          break
        }
      }
    }
    await browser.storage.local.set({ favicons: newFavicons, favUrls })
  } else {
    await browser.storage.local.remove('favicons')
  }

  // --- Panels ---
  let { containers } = await browser.storage.local.get({ containers: null })
  if (containers) {
    await browser.storage.local.set({ panels: containers })
    await browser.storage.local.remove('containers')
  }

  // --- Snapshots ---
  let { snapshots } = await browser.storage.local.get({ snapshots: null })
  if (snapshots) {
    if (snapshots.length) {
      for (let snapshot of snapshots) {
        snapshot.time = snapshot.time * 1000
        snapshot.id = Math.random().toString(16).replace('0.', Date.now().toString(16))
        snapshot.containersById = {}
        if (snapshot.ctxs) {
          for (let ctx of snapshot.ctxs) {
            snapshot.containersById[ctx.cookieStoreId] = {
              id: ctx.cookieStoreId,
              color: ctx.color,
              icon: ctx.icon,
              name: ctx.name,
            }
          }
          delete snapshot.ctxs
        }
        snapshot.windows = { '1': { items: [] } }
        if (snapshot.tabs) {
          let containerId
          for (let tab of snapshot.tabs) {
            if (tab.pinned) {
              tab.ctr = tab.cookieStoreId
              snapshot.windows['1'].items.push(tab)
              continue
            }
            if (containerId !== tab.cookieStoreId) {
              containerId = tab.cookieStoreId
              snapshot.windows['1'].items.push(tab.cookieStoreId)
            }
            snapshot.windows['1'].items.push(tab)
          }
          delete snapshot.tabs
        }
      }
    }
    await browser.storage.local.set({ snapshots })
  }

  // --- Tree ---
  let { tabsTreeState } = await browser.storage.local.get({
    tabsTreeState: null,
  })
  if (tabsTreeState) {
    if (tabsTreeState.length) {
      await browser.storage.local.set({ tabsTrees: [tabsTreeState] })
    }
    await browser.storage.local.remove('tabsTreeState')
  }

  await browser.storage.local.set({ settings })
}

export default {
  checkVersion,
  upgradeToV3,
}