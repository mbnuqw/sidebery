<template lang="pug">
.SearchPanel
  ScrollBox
    .search-groups
      template(v-for="panel in searchPanels" :key="panel.id")
        .search-group(v-if="hasMatches(panel)")
          .group-header(:data-color="panel.reactive.color")
            img.icon(v-if="!!panel.reactive.iconIMG" :src="panel.reactive.iconIMG")
            svg.icon(v-else-if="panel.reactive.iconSVG"): use(:href="'#' + panel.reactive.iconSVG")
            .title {{panel.name}}
          .group-list
            TabComponent(v-for="id in getVisibleTabIds(panel)" :key="id" :tabId="id")
</template>

<script lang="ts" setup>
import { computed } from 'vue'
import * as Sidebar from 'src/services/sidebar.fg'
import * as Utils from 'src/utils'
import ScrollBox from 'src/components/scroll-box.vue'
import TabComponent from './tab.vue'
import type { Panel, TabsPanel } from 'src/types'

const searchPanels = computed(() => {
  return Sidebar.panels.filter(p => Utils.isTabsPanel(p))
})

function hasMatches(panel: Panel): boolean {
  if (Utils.isTabsPanel(panel)) return (panel.reactive.filteredLen ?? 0) > 0
  return false
}

function getVisibleTabIds(panel: Panel): ID[] {
  if (!Utils.isTabsPanel(panel)) return []
  return panel.reactive.visibleTabIds || []
}
</script>
