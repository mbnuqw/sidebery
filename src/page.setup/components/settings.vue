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
  HistorySection
  AppearanceSection
  MouseSection
  SnapshotsSection
  SyncSection
  HelpSection
  FooterSection

  .btw: p v{{Info.reactive.addonVer}}

  Transition(name="popup")
    .popup-layer(
      v-if="SetupPage.reactive.permissions"
      @click="SetupPage.closePermissionsPopup")
      .popup-box(@click.stop="")
        PermissionsPopup
</template>

<script lang="ts" setup>
import { ref, onActivated } from 'vue'
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
import HistorySection from './settings.history.vue'
import AppearanceSection from './settings.appearance.vue'
import MouseSection from './settings.mouse.vue'
import SnapshotsSection from './settings.snapshots.vue'
import SyncSection from './settings.sync.vue'
import HelpSection from './settings.help.vue'
import PermissionsPopup from 'src/page.setup/components/popup.permissions.vue'
import FooterSection from './footer-section.vue'

const rootEl = ref<HTMLElement | null>(null)

// Restore prev scroll position
let scrollY = 0
onActivated(() => {
  if (scrollY && rootEl.value) rootEl.value.scrollTop = scrollY
})

function onScroll(e: Event): void {
  scrollY = (e.target as HTMLElement).scrollTop
  if (SetupPage.reactive.navLock) return
  SetupPage.updateActiveSection((e.target as HTMLElement).scrollTop)
}
</script>
