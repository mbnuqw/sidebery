/**
 * Handle changes of all storages (update current state)
 */
function onStorageChange(changes, type) {
  if (type !== 'local') return

  if (changes.settings) this.settings = changes.settings.newValue
  if (changes.containers) {
    this.actions.updateContainers(changes.containers.newValue)
  }
}

function setupStorageListeners() {
  browser.storage.onChanged.addListener(this.actions.onStorageChange)
}

export default {
  onStorageChange,
  setupStorageListeners,
}