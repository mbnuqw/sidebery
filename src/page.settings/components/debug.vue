<template lang="pug">
.Debug: .wrapper(v-noise:300.g:12:af.a:0:42.s:0:9="")
  //- h1 Debug

  .info
    h2 General info
    section
      .field
        .label Storage:
        .value {{storageUsedAll}}
      .separator
      .sub
        .field
          .label Favicons:
          .value {{storageFavsCount}}: {{storageUsedFavs}}
        .separator
        .field
          .label Tabs Tree:
          .value {{storageUsedTabsTree}}
        .separator
        .field
          .label Snapshots:
          .value {{storageUsedSnapshots}}

    section
      .field
        .label Windows:
        .value {{windowsCount}}
      .separator
      .sub
        .field
          .label Containers:
          .value {{containersCount}}
        .separator
        .field
          .label Tabs:
          .value {{tabsCount}}
        .separator
        .field
          .label Pinned Tabs:
          .value {{pinnedTabsCount}}

    section
      .field
        .label Bookmarks:
        .value {{bookmarksCount}}
      .separator
      .sub
        .field
          .label Folders:
          .value {{foldersCount}}
        .separator
        .field
          .label Separators:
          .value {{separatorsCount}}
        .separator
        .field
          .label Max Depth:
          .value {{bookmarksMaxDepth}}

  .windows
    .window(v-for="w in windows" :key="w.id")
      h2.title Window \#{{w.id}}
      section.logs
        .log(v-for="l in w.logs" :data-type="l.type") {{l.msg}}
      section.tabs
        .tab(v-for="t in w.tabs" :key="t.id")
          .refs {{getTabRefs(t)}}
          .flags
            div(:class="{ '-active': t.discarded }") d
            div(:class="{ '-active': t.muted }")  m
            div(:class="{ '-active': t.hidden }")  h
            div(:class="{ '-active': t.isParent }")  p
            div(:class="{ '-active': t.folded }")  f
            div(:class="{ '-active': t.invisible }")  i
          .lvl {{'*'.padStart(t.lvl + 1, ' ')}}

  .data
    h2 JSON
    section
      .json(title="click to select" ref="data" @click="onDataClick") {{jsonData}}

  FooterSection
</template>


<script>
import FooterSection from './footer'

export default {
  components: {
    FooterSection,
  },

  data() {
    return {
      storageUsedAll: '-',
      storageUsedFavs: '-',
      storageFavsCount: 0,
      storageUsedTabsTree: '-',
      storageUsedSnapshots: '-',
      windowsCount: 0,
      containersCount: 0,
      tabsCount: 0,
      pinnedTabsCount: 0,
      bookmarksCount: 0,
      foldersCount: 0,
      separatorsCount: 0,
      bookmarksMaxDepth: 0,
      windows: [],
      jsonData: '',
    }
  },

  async created() {
    // Get debug info
    const currentWindow = await browser.windows.getCurrent()
    const windows = await browser.windows.getAll()
    const info = await browser.runtime.sendMessage({
      action: 'getCommonDbgInfo',
      windowId: currentWindow.id,
      instanceType: 'sidebar',
    })
    if (!info) return

    for (let win of windows) {
      const winInfo = await browser.runtime.sendMessage({
        action: 'getWindowDbgInfo',
        instanceType: 'sidebar',
        windowId: win.id,
      })

      if (winInfo) Object.assign(win, winInfo)
    }
    info.windows = windows

    this.parseDebugInfo(info)

    // Bind importDebugInfo method to global function
    window.importDebugInfo = this.importDebugInfo
  },

  methods: {
    /**
     * Handle click on data section
     */
    onDataClick() {
      const selection = window.getSelection()
      const range = new window.Range()
      range.selectNode(this.$refs.data)
      selection.addRange(range)
    },
  
    /**
     * Get refs-info of provided tab
     */
    getTabRefs(tab) {
      const index = String(tab.index).padStart(4, ' ')
      const id = String(tab.id).padStart(5, ' ')
      const ctxIdI = tab.cookieStoreId.lastIndexOf('-')
      let ctx = tab.cookieStoreId.slice(ctxIdI + 1).padStart(5, ' ')
      if (ctx.length > 5) {
        ctx = tab.pinned ? '    ^' : '    -'
      }
      return index + id + ctx
    },

    /**
     * Parse debug info
     */
    parseDebugInfo(info) {
      this.jsonData = JSON.stringify(info)

      this.storageUsedAll = info.storage.overal
      this.storageUsedFavs = info.storage.favicons
      this.storageFavsCount = info.storage.faviconsCount
      this.storageUsedTabsTree = info.storage.tabs
      this.storageUsedSnapshots = info.storage.snapshots

      this.windowsCount = info.windows.length
      this.containersCount = info.panels.filter(p => p.type === 'ctx').length
      const tabs = info.windows.reduce((a, w) => a.concat(w.tabs), [])
      this.tabsCount = tabs.length
      this.pinnedTabsCount = tabs.filter(t => t.pinned).length

      this.bookmarksCount = info.bookmarks.bookmarksCount
      this.foldersCount = info.bookmarks.foldersCount
      this.separatorsCount = info.bookmarks.separatorsCount
      this.bookmarksMaxDepth = info.bookmarks.maxDepth

      this.windows = info.windows.map(w => {
        w.logs = w.logs.map(l => {
          let type = 'info'
          if (l.startsWith('[WARN]')) type = 'warn'
          return { type, msg: l.slice(l.indexOf('] ') + 2) }
        })

        return w
      })
    },

    /**
     * Import debug info
     */
    importDebugInfo(json) {
      this.parseDebugInfo(JSON.parse(json))
    },
  },
}
</script>
