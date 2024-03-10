<template lang="pug">
#root.root.Setup(
  :data-toolbar-color-scheme="Styles.reactive.toolbarColorScheme"
  :data-animations="animations"
  :data-sticky-bookmarks="Settings.state.pinOpenedBookmarksFolder")
  .nav
    div(
      v-for="opt in SetupPage.reactive.nav"
      :class="'sub-'.repeat(opt.lvl) + 'option'"
      :data-active="opt.name === (opt.sub ? SetupPage.reactive.activeSection : SetupPage.reactive.activeView)"
      @click="navigateTo(opt.name)")
      .body {{translate(`settings.nav_${opt.name}`)}}

  transition(name="view" mode="out-in")
    keep-alive
      SettingsView(v-if="SetupPage.reactive.activeView === 'settings'")
      MenuEditorView(v-else-if="SetupPage.reactive.activeView === 'menu_editor'")
      StylesEditorView(v-else-if="SetupPage.reactive.activeView === 'styles_editor'")
      SnapshotsView(v-else-if="SetupPage.reactive.activeView === 'snapshots'")
      StorageView(v-else-if="SetupPage.reactive.activeView === 'storage'")
      KeybindingsView(v-else)
  
  Transition(name="popup"): BookmarksPopup(v-if="Bookmarks.reactive.popup")
  Transition(name="popup"): NewTabShortcutsPopup(v-if="Popups.reactive.newTabShortcutsPopup")
  Transition(name="popup"): TabMoveRulesPopup(v-if="Popups.reactive.tabMoveRulesPopup")
  Transition(name="popup"): TabReopenRulesPopup(v-if="Popups.reactive.tabReopenRulesPopup")
  Transition(name="popup" type="transition"): DialogPopup(v-if="Popups.reactive.dialog" :dialog="Popups.reactive.dialog")
  Details

  UpgradeScreen(v-if="reactiveUpgrading.status")
</template>

<script lang="ts" setup>
import { computed, onMounted } from 'vue'
import { translate } from 'src/dict'
import { Settings } from 'src/services/settings'
import { SetupPage } from 'src/services/setup-page'
import { Bookmarks } from 'src/services/bookmarks'
import { Styles } from 'src/services/styles'
import SettingsView from './components/settings.vue'
import MenuEditorView from './components/menu-editor.vue'
import StylesEditorView from './components/styles-editor.vue'
import SnapshotsView from './components/snapshots.vue'
import StorageView from './components/storage.vue'
import KeybindingsView from './components/keybindings.vue'
import BookmarksPopup from 'src/components/popup.bookmarks.vue'
import NewTabShortcutsPopup from 'src/components/popup.new-tab-shortcuts.vue'
import TabMoveRulesPopup from 'src/components/popup.tab-move-rules.vue'
import TabReopenRulesPopup from 'src/components/popup.tab-reopen-rules.vue'
import DialogPopup from 'src/components/popup.dialog.vue'
import UpgradeScreen from 'src/components/upgrade-screen.vue'
import Details from './components/settings.details.vue'
import * as Popups from 'src/services/popups'
import { reactiveUpgrading } from 'src/services/upgrading'

const animations = computed(() => (Settings.state.animations ? 'fast' : 'none'))

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

    // Tab reopening rules popup
    if (Popups.reactive.tabReopenRulesPopup) {
      Popups.closeTabReopenRulesPopup()
      return
    }

    // Tab moving rules popup
    if (Popups.reactive.tabMoveRulesPopup) {
      Popups.closeTabMoveRulesPopup()
      return
    }

    // New tab shortcuts popup
    if (Popups.reactive.newTabShortcutsPopup) {
      Popups.closeNewTabShortcutsPopup()
      return
    }

    // Dialog
    if (Popups.reactive.dialog) {
      Popups.reactive.dialog.result(null)
      return
    }

    // Panel/Container config
    if (SetupPage.reactive.selectedPanelConfig) SetupPage.reactive.selectedPanelConfig = null
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
  const cHash = location.hash.slice(1)
  if (cHash === urlHash) {
    SetupPage.updateActiveView()
  } else {
    location.hash = urlHash
  }
}
</script>
