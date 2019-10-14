/**
 * Handle click on browser-action button
 */
function initToolbarButton() {
  browser.browserAction.onClicked.addListener(async () => {
    browser.sidebarAction.open()
  })
}


export default {
  initToolbarButton,
}