<template lang="pug">
.TabsPanelRemoving.popup-container(@click="cancelRemoving")
  .popup(@click.stop)
    h2 {{translate('popup.tabs_panel_removing.title')}}
    .note(v-if="Windows.otherWindows.length") {{translate('popup.tabs_panel_removing.other_win_note')}}
    .ctrls
      .btn.-wide.-wrap(
        v-if="otherPanelsExisted"
        @click="continueRemoving(TabsPanelRemovingMode.Attach)") {{translate('popup.tabs_panel_removing.attach')}}
      .btn.-wide.-wrap(
        v-else
        @click="continueRemoving(TabsPanelRemovingMode.Attach)") {{translate('popup.tabs_panel_removing.leave')}}
      .btn.-wide.-wrap(
        v-if="!isRoot"
        @click="continueRemoving(TabsPanelRemovingMode.SaveAndClose)") {{translate('popup.tabs_panel_removing.save')}}
      .btn.-wide.-wrap(
        @click="continueRemoving(TabsPanelRemovingMode.Close)") {{translate('popup.tabs_panel_removing.close')}}
      .btn.-warn.-wide(
        @click="cancelRemoving") {{translate('btn.cancel')}}
</template>

<script lang="ts" setup>
import { computed } from 'vue'
import { translate } from 'src/dict'
import { PanelType, TabsPanelRemovingMode } from 'src/types'
import { Sidebar } from 'src/services/sidebar'
import { Windows } from 'src/services/windows'
import Utils from 'src/utils'
import { BKM_MENU_ID, BKM_MOBILE_ID, BKM_OTHER_ID, BKM_TLBR_ID } from 'src/defaults'

const otherPanelsExisted = computed<boolean>(() => {
  return !!Sidebar.reactive.panels.find(p => {
    return p.type === PanelType.tabs && Sidebar.reactive.tabsPanelRemoving?.id !== p.id
  })
})

const isRoot = computed<boolean>(() => {
  if (!Sidebar.reactive.tabsPanelRemoving) return false

  const panel = Sidebar.reactive.panelsById[Sidebar.reactive.tabsPanelRemoving.id]
  if (!Utils.isTabsPanel(panel)) return false

  if (panel.bookmarksFolderId === BKM_OTHER_ID) return true
  if (panel.bookmarksFolderId === BKM_MENU_ID) return true
  if (panel.bookmarksFolderId === BKM_MOBILE_ID) return true
  if (panel.bookmarksFolderId === BKM_TLBR_ID) return true

  return false
})

function continueRemoving(mode: TabsPanelRemovingMode): void {
  if (!Sidebar.reactive.tabsPanelRemoving) return
  Sidebar.reactive.tabsPanelRemoving.withMode(mode)
}

function cancelRemoving(): void {
  if (!Sidebar.reactive.tabsPanelRemoving) return
  Sidebar.reactive.tabsPanelRemoving.withMode(null)
}
</script>
