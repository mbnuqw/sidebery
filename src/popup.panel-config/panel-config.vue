<template lang="pug">
#root.root.PanelConfig(
  :data-native-scrollbar="Settings.state.nativeScrollbars"
  :data-native-scrollbars-thin="Settings.state.nativeScrollbarsThin"
  :data-native-scrollbars-left="Settings.state.nativeScrollbarsLeft"
  :data-theme="Settings.state.theme"
  :data-density="Settings.state.density"
  :data-frame-color-scheme="Styles.reactive.frameColorScheme"
  :data-toolbar-color-scheme="Styles.reactive.toolbarColorScheme"
  :data-act-el-color-scheme="Styles.reactive.actElColorScheme"
  :data-popup-color-scheme="Styles.reactive.popupColorScheme"
  :data-animations="animations"
  :data-tabs-tree-lvl-marks="Settings.state.tabsLvlDots")

  PanelConfigPopup(v-if="panelConfig" :conf="panelConfig")

  Transition(name="popup"): BookmarksPopup(v-if="Bookmarks.reactive.popup")
  Transition(name="popup"): NewTabShortcutsPopup(v-if="Popups.reactive.newTabShortcutsPopup")
  Transition(name="popup"): TabMoveRulesPopup(v-if="Popups.reactive.tabMoveRulesPopup")

  NotificationsPopup
</template>

<script lang="ts" setup>
import { computed, onMounted } from 'vue'
import { PanelConfig } from 'src/types'
import { NOID } from 'src/defaults'
import { Settings } from 'src/services/settings'
import { Styles } from 'src/services/styles'
import { Logs, SidebarConfig, Popups } from 'src/services/_services'
import { Bookmarks } from 'src/services/bookmarks'
import PanelConfigPopup from 'src/page.setup/components/popup.panel-config.vue'
import NewTabShortcutsPopup from 'src/components/popup.new-tab-shortcuts.vue'
import TabMoveRulesPopup from 'src/components/popup.tab-move-rules.vue'
import NotificationsPopup from 'src/sidebar/components/popup.notifications.vue'
import BookmarksPopup from 'src/components/popup.bookmarks.vue'

const animations = computed(() => (Settings.state.animations ? 'fast' : 'none'))
const params = new URLSearchParams(location.search)
const panelId = params.get('panelId')
const panelConfig = computed<PanelConfig | undefined>(() => {
  return SidebarConfig.reactive.panels[panelId || NOID]
})

onMounted(() => {
  document.addEventListener('keydown', onDocumentKeydown)

  // Select fields found by Firefox find
  document.addEventListener('selectionchange', () => {
    const selection = document.getSelection()
    if (selection?.type !== 'Range') return

    let parentEl = selection?.focusNode?.parentElement
    if (!parentEl) return

    if (parentEl.hasAttribute('tabindex')) return parentEl.focus()

    let selEl: Element | null | undefined = parentEl.querySelector('[tabindex]')
    if (selEl instanceof HTMLElement) return selEl.focus()

    parentEl = parentEl.parentElement
    selEl = parentEl?.querySelector('[tabindex]')
    if (selEl instanceof HTMLElement) return selEl.focus()
  })
})

function onDocumentKeydown(e: KeyboardEvent) {
  if (e.code === 'Escape') {
    if (Popups.reactive.newTabShortcutsPopup) {
      Popups.closeNewTabShortcutsPopup()
      return
    }
    if (Popups.reactive.tabMoveRulesPopup) {
      Popups.closeTabMoveRulesPopup()
      return
    }
    if (Bookmarks.reactive.popup?.close) {
      Bookmarks.reactive.popup.close()
      return
    }
    window.close()
  }
}
</script>
