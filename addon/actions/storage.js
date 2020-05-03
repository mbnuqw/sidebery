/**
 * Handle changes of all storages (update current state)
 */
function onStorageChange(changes, type) {
  if (type !== 'local') return

  if (changes.settings) {
    if (this.settings.markWindow !== changes.settings.newValue.markWindow) {
      for (let win of Object.values(this.windows)) {
        if (win.type !== 'normal') continue
        if (this.settings.markWindow) {
          browser.windows.update(win.id, { titlePreface: '' })
        } else if (win.sidebarPort) {
          browser.windows.update(win.id, { titlePreface: this.settings.markWindowPreface })
        }
      }
    }
    if (this.settings.markWindowPreface !== changes.settings.newValue.markWindowPreface) {
      let value = changes.settings.newValue.markWindowPreface
      for (let win of Object.values(this.windows)) {
        if (win.type !== 'normal') continue
        if (this.settings.markWindow && win.sidebarPort) {
          browser.windows.update(win.id, { titlePreface: value })
        }
      }
    }
    this.settings = changes.settings.newValue
  }
  if (changes.containers_v4) {
    this.actions.updateContainers(changes.containers_v4.newValue)
  }
}

function setupStorageListeners() {
  browser.storage.onChanged.addListener(this.actions.onStorageChange)
}

export default {
  onStorageChange,
  setupStorageListeners,
}
