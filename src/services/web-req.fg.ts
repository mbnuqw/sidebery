import { Tabs } from './tabs.fg'
import { Windows } from './windows'
import * as Logs from './logs'
import * as Utils from 'src/utils'
import { Settings } from './settings'
import { Sidebar } from './sidebar'
import { Containers } from './containers'

type optBlockingResponse = browser.webRequest.BlockingResponse | void

let handledReqId: string | undefined

function onBeforeRequestHandler(info: browser.webRequest.ReqDetails): optBlockingResponse {
  if (!Tabs.byId) return

  const tab = Tabs.byId[info.tabId]
  if (!tab) return

  if (handledReqId !== info.requestId && tab.reopenInContainer) {
    handledReqId = info.requestId

    const panel = Sidebar.panelsById[tab.panelId]
    if (Utils.isTabsPanel(panel) && panel.newTabCtx === tab.reopenInContainer) {
      const dst = { panelId: tab.panelId, containerId: tab.reopenInContainer }
      const item = { id: tab.id, url: info.url, active: tab.active, index: tab.index }
      delete tab.reopenInContainer
      if (info.method == "POST") {
        Logs.warn("onBeforeRequestHandler not reopening, POST.")
        return {}
      }
      Tabs.reopen([item], dst)
      return { cancel: true }
    }
  }
}

export function turnOnBeforeRequestHandler() {
  if (!browser.webRequest) return
  const eventTarget = browser.webRequest.onBeforeRequest
  if (!eventTarget.hasListener(onBeforeRequestHandler)) {
    const filter: browser.webRequest.RequestFilter = {
      urls: ['<all_urls>'],
      windowId: Windows.id,
      incognito: false,
      types: ['main_frame'],
    }
    eventTarget.addListener(onBeforeRequestHandler, filter, ['blocking'])
  }
}

export function turnOffBeforeRequestHandler() {
  if (!browser.webRequest) return
  const eventTarget = browser.webRequest.onBeforeRequest
  if (eventTarget.hasListener(onBeforeRequestHandler)) {
    eventTarget.removeListener(onBeforeRequestHandler)
  }
}

export function updateWebReqHandlers() {
  let listen = false

  // Check panels config
  if (Settings.state.newTabCtxReopen) {
    for (const panel of Sidebar.panels) {
      if (Utils.isTabsPanel(panel)) {
        const container = Containers.reactive.byId[panel.newTabCtx]
        if (container) {
          listen = true
          break
        }
      }
    }
  }

  if (listen) turnOnBeforeRequestHandler()
  else turnOffBeforeRequestHandler()
}
