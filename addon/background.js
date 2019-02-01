browser.browserAction.onClicked.addListener(() => {
  browser.sidebarAction.open()
})

browser.runtime.onMessage.addListener(() => {
  // just listen to avoid error on sending message
})