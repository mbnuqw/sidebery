/**
 * Handle click on browser-action button
 */
function initToolbarButton() {
  browser.browserAction.onClicked.addListener(() => {
    browser.sidebarAction.open()
  })
}


export default {
  initToolbarButton,
}