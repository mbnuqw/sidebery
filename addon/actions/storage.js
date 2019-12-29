/**
 * Handle changes of all storages (update current state)
 */
function onStorageChange(changes, type) {
  if (type !== 'local') return

  if (changes.settings) this.settings = changes.settings.newValue
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
