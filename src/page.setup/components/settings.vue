<template lang="pug">
.Settings(ref="rootEl" @scroll.passive="onScroll")
  GeneralSection
  MenuSection
  NavbarSection
  GroupSection
  ContainersSection
  DndSection
  SearchSection
  TabsSection
  NewTabPositionSection
  PinnedTabsSection
  TabsTreeSection
  BookmarksSection
  DownloadsSection
  HistorySection
  AppearanceSection
  MouseSection
  KeybindingsSection
  PermissionsSection
  SnapshotsSection
  SyncSection
  HelpSection
  FooterSection

  .btw: p v{{Info.reactive.addonVer}}
</template>

<script lang="ts" setup>
import { ref, watch, onActivated } from 'vue'
import Utils from 'src/utils'
import { Settings } from 'src/services/settings'
import { SetupPage } from 'src/services/setup-page'
import { Info } from 'src/services/info'
import GeneralSection from './settings.general.vue'
import MenuSection from './settings.menu.vue'
import NavbarSection from './settings.navbar.vue'
import GroupSection from './settings.group.vue'
import ContainersSection from './settings.containers.vue'
import DndSection from './settings.dnd.vue'
import SearchSection from './settings.search.vue'
import TabsSection from './settings.tabs.vue'
import NewTabPositionSection from './settings.new-tab-position.vue'
import PinnedTabsSection from './settings.pinned-tabs.vue'
import TabsTreeSection from './settings.tabs-tree.vue'
import BookmarksSection from './settings.bookmarks.vue'
import DownloadsSection from './settings.downloads.vue'
import HistorySection from './settings.history.vue'
import AppearanceSection from './settings.appearance.vue'
import MouseSection from './settings.mouse.vue'
import KeybindingsSection from './settings.keybindings.vue'
import PermissionsSection from './settings.permissions.vue'
import SnapshotsSection from './settings.snapshots.vue'
import SyncSection from './settings.sync.vue'
import HelpSection from './settings.help.vue'
import FooterSection from './footer-section.vue'

const rootEl = ref<HTMLElement | null>(null)

// Restore prev scroll position
let scrollY = 0
onActivated(() => {
  if (scrollY && rootEl.value) rootEl.value.scrollTop = scrollY
})

// Auto save settings after change
let saveTimeout: number | undefined
watch(Settings.reactive, () => {
  saveTimeout = Utils.wait(saveTimeout, 500, () => Settings.saveSettings())
})

function onScroll(e: Event): void {
  scrollY = (e.target as HTMLElement).scrollTop
  if (SetupPage.reactive.navLock) return
  SetupPage.updateActiveSection((e.target as HTMLElement).scrollTop)
}
</script>
