<template lang="pug">
#root.root(
  :data-color-scheme="Styles.reactive.colorScheme"
  :data-animations="animations"
  :data-sticky-bookmarks="Settings.reactive.pinOpenedBookmarksFolder")
  .nav
    div(
      v-for="opt in SetupPage.reactive.nav"
      :class="opt.sub ? 'sub-option' : 'option'"
      :data-active="opt.name === (opt.sub ? SetupPage.reactive.activeSection : SetupPage.reactive.activeView)"
      @click="navigateTo(opt.name)")
      .body {{translate(`settings.nav_${opt.name}`)}}

  transition(name="view" mode="out-in")
    keep-alive
      component(:is="view")
  
  Transition(name="popup"): BookmarksPopup(v-if="Bookmarks.reactive.popup")
  Details

  UpgradeScreen(v-if="Sidebar.reactive.upgrading")
</template>

<script lang="ts" setup>
import { computed, onMounted } from 'vue'
import { translate } from 'src/dict'
import { Settings } from 'src/services/settings'
import { SetupPage } from 'src/services/setup-page'
import { Bookmarks } from 'src/services/bookmarks'
import { Styles } from 'src/services/styles'
import { Sidebar } from 'src/services/sidebar'
import SettingsView from './components/settings.vue'
import MenuEditorView from './components/menu-editor.vue'
import StylesEditorView from './components/styles-editor.vue'
import SnapshotsView from './components/snapshots.vue'
import StorageView from './components/storage.vue'
import KeybindingsView from './components/keybindings.vue'
import BookmarksPopup from 'src/components/popup.bookmarks.vue'
import UpgradeScreen from 'src/components/upgrade-screen.vue'
import Details from './components/settings.details.vue'

const animations = computed(() => (Settings.reactive.animations ? 'fast' : 'none'))
const view = computed(() => {
  if (SetupPage.reactive.activeView === 'settings') return SettingsView
  if (SetupPage.reactive.activeView === 'menu_editor') return MenuEditorView
  if (SetupPage.reactive.activeView === 'styles_editor') return StylesEditorView
  if (SetupPage.reactive.activeView === 'snapshots') return SnapshotsView
  if (SetupPage.reactive.activeView === 'storage') return StorageView
  if (SetupPage.reactive.activeView === 'keybindings') return KeybindingsView
  return null
})

onMounted(() => {
  document.addEventListener('keyup', onDocumentKeyup)
})

function onDocumentKeyup(e: KeyboardEvent): void {
  // Close popups
  if (e.code === 'Escape') {
    // Bookmarks popup
    if (Bookmarks.reactive.popup?.close) {
      Bookmarks.reactive.popup.close()
      return
    }

    // Panel/Container config
    if (SetupPage.reactive.selectedPanel) SetupPage.reactive.selectedPanel = null
    if (SetupPage.reactive.selectedContainer) SetupPage.reactive.selectedContainer = null

    // Details
    if (SetupPage.reactive.detailsText) {
      SetupPage.reactive.detailsText = ''
      SetupPage.reactive.detailsTitle = ''
      SetupPage.reactive.detailsEdit = undefined
    }

    // Export/Import
    if (SetupPage.reactive.exportDialog) SetupPage.reactive.exportDialog = false
    if (SetupPage.reactive.importedData) SetupPage.reactive.importedData = null
  }
}

function navigateTo(urlHash: string): void {
  location.hash = urlHash
}
</script>
