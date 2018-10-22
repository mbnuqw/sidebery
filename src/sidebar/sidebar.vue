<template lang="pug">
.Sidebar(
  :data-menu="menuOpened"
  @wheel="onWH"
  @contextmenu.prevent.stop=""
  @dragover.prevent=""
  @dragenter="onDragEnter"
  @dragleave="onDragLeave"
  @drop="onDrop"
  @mouseenter="onME"
  @mouseleave="onML"
  @mousedown="onMD")
  ctx-menu
  window-input(:is-active="!!$root.winChoosing")
  .bg(v-noise:300.g:12:af.a:0:42.s:0:9="", :style="bgPosStyle")
  .dimmer(@mousedown="closeMenu")
  .nav(ref="nav")
    keep-alive
      component.panel-menu(
        v-if="menu" 
        ref="menu"
        :is="menu.menu" 
        :conf="menu"
        @close="closeMenu"
        @height="recalcMenuHeight"
        @panel-cmd="panelCmd")

    .nav-strip(@wheel="onNavWheel")
      .panel-btn(
        v-for="(btn, i) in nav"
        :key="btn.cookieStoreId || btn.name"
        :title="btn.name"
        :data-active="panel === i"
        :data-hidden="btn.hidden"
        @click="onNavClick(i)"
        @mousedown.right="openMenu(i)")
        svg(:style="{fill: btn.colorCode}")
          use(:xlink:href="'#' + btn.icon")

    //- Add new container
    .add-btn(v-if="!$root.private", :title="t('sidebar.nav_add_ctx_title')", @click="openMenu(-1)")
      svg: use(xlink:href="#icon_plus_v2")

    //- Settings
    .settings-btn(:data-active="settingsOpened", :title="t('sidebar.nav_settings_title')", @click="toggleSettings")
      svg: use(xlink:href="#icon_settings")

  //- Panels
  .panel-box
    component.panel(
      v-for="(c, i) in panels"
      ref="panels"
      :key="c.cookieStoreId || c.name"
      :is="c.panel"
      :tabs="c.tabs"
      :store-id="c.cookieStoreId"
      :pos="getPanelPos(i)"
      :active="i === panel"
      @create-tab="createTab"
      @closedown="closeTabsDown(i, $event)")
    settings-panel.panel(:pos="settingsPanelPos")
</template>


<script>
import Vue from 'vue'
import NoiseBg from '../directives/noise-bg'
import Utils from '../libs/utils'
import Logs from '../libs/logs'
import { Translate } from '../mixins/dict'
import CtxMenu from './context-menu'
import BookmarksPanel from './bookmarks'
import BookmarksMenu from './bookmarks.menu'
import TabsPanel from './tabs'
import TabsDefaultMenu from './tabs.default.menu'
import TabsMenu from './tabs.menu'
import SettingsPanel from './settings'
import WindowInput from './input.window'

Vue.directive('noise', NoiseBg)

const DEFAULT_PANELS = [
  {
    name: Translate('bookmarks_menu.title'),
    icon: 'icon_bookmarks',
    menu: BookmarksMenu,
    panel: BookmarksPanel,
  },
  {
    name: Translate('pinned_tabs_menu.title'),
    icon: 'icon_pin',
    menu: TabsDefaultMenu,
    pinned: true,
  },
  {
    name: Translate('private_tabs_menu.title'),
    icon: 'icon_tabs',
    cookieStoreId: 'firefox-private',
    menu: TabsDefaultMenu,
    private: true,
  },
  {
    name: Translate('default_tabs_menu.title'),
    icon: 'icon_tabs',
    cookieStoreId: 'firefox-default',
    menu: TabsDefaultMenu,
  },
]

// --- Vue Component ---
export default {
  components: {
    CtxMenu,
    BookmarksPanel,
    TabsDefaultMenu,
    TabsPanel,
    SettingsPanel,
    WindowInput,
  },

  data() {
    return {
      winId: null,
      width: 250,
      menuOpened: false,
      menu: null,
      panel: this.$root.activePanel,
      settingsOpened: false,
      contexts: [],
      allTabs: [],
      activeTabs: [],
      drag: null,
    }
  },

  /**
   * --- Computed ---
   */
  computed: {
    /**
     * Background tranform style for parallax fx
     */
    bgPosStyle() {
      return { transform: `translateX(-${this.panel * 5}%)` }
    },

    /**
     * Get settings-panel position
     */
    settingsPanelPos() {
      return this.settingsOpened ? 'center' : 'right'
    },

    /**
     * Get list of navigational buttons
     * {
     *   ...ContextualIdentity,
     *   comp: VueComponent - Menu panel
     *   hidden: boolean
     * }
     */
    nav() {
      let noPinned = !this.pinnedTabs.length
      let cap = ~~((this.width - 56) / 34)
      let halfCap = cap >> 1
      let invModCap = (cap % halfCap) ^ 1

      let i
      let k = 0
      let out = []
      let hideOffset = 0
      for (i = 0; i < DEFAULT_PANELS.length; i++, k++) {
        const btn = DEFAULT_PANELS[i]
        btn.hidden = false
        if (noPinned && btn.pinned) {
          btn.hidden = true
          if (this.panel > k) hideOffset++
        }
        if (!this.$root.private && btn.private) {
          btn.hidden = true
          if (this.panel > k) hideOffset++
        }
        if (this.$root.private && btn.cookieStoreId === 'firefox-default') {
          btn.hidden = true
          if (this.panel > k) hideOffset++
        }
        out.push(btn)
      }
      for (i = 0; i < this.contexts.length; i++, k++) {
        const btn = this.contexts[i]
        if (this.$root.private) {
          btn.hidden = true
          continue
        }
        if (!btn.menu) btn.menu = TabsMenu
        btn.hidden = false
        out.push(btn)
      }

      let p = this.panel - hideOffset
      let vis = out.length - hideOffset
      for (i = 0, k = 0; i < out.length; i++) {
        if (out[i].hidden) continue
        if (p - k > halfCap && vis - k > cap) out[i].hidden = true
        if (p - k < invModCap - halfCap && k > cap - 1) out[i].hidden = true
        k++
      }

      return out
    },

    /**
     * Get list of tabs panels
     */
    panels() {
      const panels = DEFAULT_PANELS.concat(this.contexts)
      let lastIndex = 0
      return panels.map((p, i) => {
        if (!p.panel) p.panel = TabsPanel

        if (p.pinned) {
          p.tabs = this.allTabs.filter(t => t.pinned).map(t => {
            let ctx = this.contexts.find(c => c.cookieStoreId === t.cookieStoreId)
            if (!ctx) return t
            t.ctxIcon = ctx.icon
            t.ctxColor = ctx.colorCode
            return t
          })
          this.updateActiveTab(i, p.tabs)
          if (p.tabs.length) {
            lastIndex = p.tabs[p.tabs.length - 1].index
            p.startIndex = p.tabs[0].index
            p.endIndex = lastIndex++
          } else {
            p.startIndex = lastIndex
            p.endIndex = p.startIndex
          }
          return p
        }

        if (p.cookieStoreId) {
          p.tabs = this.allTabs.filter(t => {
            return t.cookieStoreId === p.cookieStoreId && !t.pinned
          })
          this.updateActiveTab(i, p.tabs)
          if (p.tabs.length) {
            lastIndex = p.tabs[p.tabs.length - 1].index
            p.startIndex = p.tabs[0].index
            p.endIndex = lastIndex++
          } else {
            p.startIndex = lastIndex
            p.endIndex = p.startIndex
          }
        }

        return p
      })
    },

    /**
     * Pinned tabs
     */
    pinnedTabs() {
      return this.allTabs.filter(t => t.pinned)
    },
  },

  // --- Created Hook ---
  async created() {
    // --- Setup Hooks
    // Contextual Identities
    browser.contextualIdentities.onCreated.addListener(this.onCreatedContainer)
    browser.contextualIdentities.onRemoved.addListener(this.onRemovedContainer)
    browser.contextualIdentities.onUpdated.addListener(this.onUpdatedContainer)

    // Tabs
    browser.tabs.onCreated.addListener(this.onCreatedTab)
    browser.tabs.onUpdated.addListener(this.onUpdatedTab)
    browser.tabs.onRemoved.addListener(this.onRemovedTab)
    browser.tabs.onMoved.addListener(this.onMovedTab)
    browser.tabs.onDetached.addListener(this.onDetachedTab)
    browser.tabs.onAttached.addListener(this.onAttachedTab)
    browser.tabs.onActivated.addListener(this.onActivatedTab)

    // --- Retrieve initial state
    this.loadWindowId()
    await this.loadContexts()
    await this.loadTabs()

    // --- Handle resizing of sidebar
    const onresize = Utils.Asap(() => this.updateNavSize(), 120)
    window.addEventListener('resize', onresize.func)
  },

  // --- Mounted Hook ---
  mounted() {
    this.updateNavSize()
  },

  beforeDestroy() {
    // Contextual Identities
    browser.contextualIdentities.onCreated.removeListener(this.onCreatedContainer)
    browser.contextualIdentities.onRemoved.removeListener(this.onRemovedContainer)
    browser.contextualIdentities.onUpdated.removeListener(this.onUpdatedContainer)

    // Tabs
    browser.tabs.onCreated.removeListener(this.onCreatedTab)
    browser.tabs.onUpdated.removeListener(this.onUpdatedTab)
    browser.tabs.onRemoved.removeListener(this.onRemovedTab)
    browser.tabs.onMoved.removeListener(this.onMovedTab)
    browser.tabs.onDetached.removeListener(this.onDetachedTab)
    browser.tabs.onAttached.removeListener(this.onAttachedTab)
    browser.tabs.onActivated.removeListener(this.onActivatedTab)
  },

  /**
   * --- Methods ---
   */
  methods: {
    /**
     * Sidebar wheel event handler
     */
    onWH(e) {
      if (this.$root.scrollThroughTabs !== 'none' && this.panel > 0) {
        if (e.deltaY > 0) this.activateNextTab({
          globaly: this.$root.scrollThroughTabs === 'global',
          cycle: false,
        })
        if (e.deltaY < 0) this.activatePrevTab({
          globaly: this.$root.scrollThroughTabs === 'global',
          cycle: false,
        })
      }

      if (this.$root.hScrollThroughPanels) {
        if (e.deltaX > 0) return this.switchToNextPanel()
        if (e.deltaX < 0) return this.switchToPrevPanel()
      }
    },

    /**
     * Navigation wheel event handler
     */
    onNavWheel(e) {
      if (e.deltaY > 0) return this.switchToNextPanel()
      if (e.deltaY < 0) return this.switchToPrevPanel()
    },

    onME() {
      if (this.leaveTimeout) {
        clearTimeout(this.leaveTimeout)
        this.leaveTimeout = null
      }
    },

    onML() {
      this.leaveTimeout = setTimeout(() => {
        this.$root.closeCtxMenu()
      }, 500)
    },

    onMD(e) {
      if (e.button < 2) this.$root.closeCtxMenu()
    },

    onDragEnter() {
      // console.log('[DEBUG] DRAG ENTER', e.dataTransfer);
    },

    onDragLeave() {
      // console.log('[DEBUG] DRAG LEAVE', e.dataTransfer);
    },

    onDrop(e) {
      if (!e.dataTransfer) return

      for (let item of e.dataTransfer.items) {
        if (item.kind !== 'string') return
        
        if (item.type === 'text/uri-list') {
          item.getAsString(s => {
            if (s.indexOf('http') === -1) return
            const panel = this.panels[this.panel]
            if (panel && panel.cookieStoreId) {
              browser.tabs.create({
                url: s,
                cookieStoreId: panel.cookieStoreId,
                windowId: this.$root.windowId,
              })
            } else {
              browser.tabs.create({ url: s, windowId: this.$root.windowId })
            }
          })
        }

        if (item.type === 'text/x-moz-text-internal') {
          item.getAsString(async s => {
            if (e.dataTransfer.dropEffect === 'move') {
              const tabs = await browser.tabs.query({
                url: s,
                currentWindow: false,
                lastFocusedWindow: true,
              })
              if (tabs.length === 0) return
              if (tabs[0].url.indexOf('http') === -1) return
              browser.tabs.move(tabs[0].id, { windowId: this.$root.windowId, index: -1 })
            }
            if (e.dataTransfer.dropEffect === 'copy') {
              if (s.indexOf('http') === -1) return
              browser.tabs.create({ windowId: this.$root.windowId, url: s })
            }
          })
          break
        }
      }
    },

    onNavClick(i) {
      if (this.panel !== i) {
        this.switchToPanel(i)
      } else if (this.panels[i].cookieStoreId) {
        browser.tabs.create({ cookieStoreId: this.panels[i].cookieStoreId })
      }
    },

    // --- Contextual Identities Hooks ---
    /**
     * contextualIdentities.onCreated
     */
    onCreatedContainer({ contextualIdentity }) {
      Logs.D(`New container created '${contextualIdentity.cookieStoreId}'`)
      let i = this.contexts.push(contextualIdentity)
      this.panel = i + 3
      this.$root.activePanel = this.panel

      // Check if we have some updates
      // for container with this name
      this.$root.resyncPanels()
    },

    /**
     * contextualIdentities.onRemoved
     */
    async onRemovedContainer({ contextualIdentity }) {
      Logs.D(`Container removed '${contextualIdentity.cookieStoreId}'`)
      let id = contextualIdentity.cookieStoreId
      let i = this.contexts.findIndex(c => c.cookieStoreId === id)
      if (i === -1) return
      this.contexts.splice(i, 1)

      // Turn off sync
      let pi = this.$root.syncPanels.findIndex(p => p === id)
      if (pi !== -1) this.$root.syncPanels.splice(pi, 1)

      // Close tabs
      let orphanTabs = await browser.tabs.query({
        windowId: browser.windows.WINDOW_ID_CURRENT,
        cookieStoreId: id,
      })
      if (orphanTabs.length > 0) {
        await browser.tabs.remove(orphanTabs.map(t => t.id))
      } else {
        this.panel = i + 3
        this.$root.activePanel = this.panel
      }
    },

    /**
     * contextualIdentities.onUpdated
     */
    onUpdatedContainer({ contextualIdentity }) {
      Logs.D(`Container updated '${contextualIdentity.cookieStoreId}'`)
      let id = contextualIdentity.cookieStoreId
      let i = this.contexts.findIndex(c => c.cookieStoreId === id)
      if (i === -1) return
      this.contexts.splice(i, 1, contextualIdentity)
      // this.$root.resyncPanels()
      this.$root.savePanels()
    },
    // ---

    // --- Tabs Handlers ---
    /**
     * tabs.onCreated
     */
    onCreatedTab(tab) {
      if (tab.windowId !== this.winId) return
      Logs.D(`Tab created, id: '${tab.id}', index: '${tab.index}', ctx: '${tab.cookieStoreId}'`)
      this.$root.closeCtxMenu()

      // If new tab is out of panel, move it to the end of
      // this panel
      let panel = this.panels.find(p => p.cookieStoreId === tab.cookieStoreId)
      if (panel && panel.tabs) {
        let targetIndex = panel.tabs.length ? panel.endIndex + 1 : panel.endIndex
        if (tab.index > targetIndex || tab.index < panel.startIndex) {
          browser.tabs.move(tab.id, { index: targetIndex })
        }
      }

      // Shift tabs after inserted one. (NOT detected by vue)
      for (let i = tab.index; i < this.allTabs.length; i++) {
        this.allTabs[i].index++
      }
      this.allTabs.splice(tab.index, 0, tab)
      this.recalcPanelScroll()
      this.$root.savePanels()
    },

    /**
     * tabs.onUpdated
     */
    onUpdatedTab(tabId, change, tab) {
      if (tab.windowId !== this.winId) return
      let upIndex = this.allTabs.findIndex(t => t.id === tabId)
      if (upIndex === -1) return

      // Handle favicon change
      // If favicon is not external link - store it in cache
      if (change.favIconUrl && change.favIconUrl.indexOf('http') !== 0) {
        this.$root.setFavicon(tab.url.split('/')[2], change.favIconUrl)
      }

      // Handle unpinned tab
      if (change.hasOwnProperty('pinned') && !change.pinned) {
        let pi = this.panels.findIndex(p => p.cookieStoreId === tab.cookieStoreId)
        if (pi === -1) return
        let p = this.panels[pi]
        if (p && p.tabs) browser.tabs.move(tabId, { index: p.endIndex })
        if (tab.active) {
          this.panel = pi
          this.$root.activePanel = this.panel
        }
      }

      this.allTabs.splice(upIndex, 1, tab)

      if (change.hasOwnProperty('pinned') && change.pinned) {
        if (tab.active) {
          this.panel = 1
          this.$root.activePanel = this.panel
        }
      }

      if (change.hasOwnProperty('url') || change.hasOwnProperty('pinned')) {
        this.$root.savePanels()
      }
    },

    /**
     * tabs.onRemoved
     */
    onRemovedTab(tabId, info) {
      if (info.windowId !== this.winId) return
      Logs.D(`Tab removed, id: '${tabId}'`)
      this.$root.closeCtxMenu()
      let rmIndex = this.allTabs.findIndex(t => t.id === tabId)
      if (rmIndex === -1) return

      // Shift tabs after removed one. (NOT detected by vue)
      for (let i = rmIndex + 1; i < this.allTabs.length; i++) {
        this.allTabs[i].index--
      }
      this.allTabs.splice(rmIndex, 1)
      this.recalcPanelScroll()
      this.$root.savePanels()
    },

    /**
     * tabs.onMoved
     */
    onMovedTab(id, info) {
      if (info.windowId !== this.winId) return
      Logs.D(`Tab moved, id: '${id}', from: '${info.fromIndex}', to: '${info.toIndex}'`)
      this.$root.closeCtxMenu()

      // If moved tab active, cut it out
      let pIndex = this.getPanelIndex(id)
      let isActive = this.activeTabs[pIndex] === id

      // Reset drag status
      let panelVM = this.$refs.panels[this.panel]
      if (panelVM && panelVM.drag) {
        panelVM.drag = null
        setTimeout(() => {
          panelVM.dragTabs = null
          panelVM.dragEnd = false
        }, 128)
      }

      // Move tab in tabs array
      let movedTab = this.allTabs.splice(info.fromIndex, 1)[0]
      if (!movedTab) return
      movedTab.index = info.toIndex
      // Shift tabs after moved one. (NOT detected by vue)
      for (let i = 0; i < this.allTabs.length; i++) {
        if (i < info.toIndex) this.allTabs[i].index = i
        else this.allTabs[i].index = i + 1
      }
      this.allTabs.splice(info.toIndex, 0, movedTab)

      // Update active tab position
      pIndex = this.getPanelIndex(id)
      if (isActive) {
        this.panel = pIndex
        this.$root.activePanel = this.panel
      }
      this.recalcPanelScroll()
    },

    /**
     * tabs.onDetached
     */
    onDetachedTab(id, info) {
      if (info.oldWindowId !== this.winId) return
      Logs.D(`Tab detached, id: '${id}'`)
      this.$root.closeCtxMenu()
      let i = this.allTabs.findIndex(t => t.id === id)
      if (i === -1) return
      this.allTabs.splice(i, 1)
      this.recalcPanelScroll()
      this.$root.savePanels()
    },

    /**
     * tabs.onAttached
     */
    onAttachedTab(id, info) {
      if (info.newWindowId !== this.winId) return
      Logs.D(`Tab attached, id: '${id}'`)
      this.$root.closeCtxMenu()
      this.loadTabs()
      this.$root.savePanels()
    },

    /**
     * tabs.onActivated
     */
    onActivatedTab(info) {
      if (info.windowId !== this.winId) return
      Logs.D(`Tab activated, id: '${info.tabId}'`)
      this.allTabs = this.allTabs.map(t => {
        t.active = info.tabId === t.id
        return t
      })

      // Switch to tab's panel
      let tab = this.allTabs.find(t => t.id === info.tabId)
      let panelIndex = 1
      if (!tab.pinned) {
        panelIndex = this.panels.findIndex(p => p.cookieStoreId === tab.cookieStoreId)
        if (panelIndex === -1) return
      }
      if (this.panel !== panelIndex) {
        this.panel = panelIndex
        this.$root.activePanel = this.panel
      }
    },
    // ---

    /**
     * Try to recalc panel's scroll
     */
    async recalcPanelScroll() {
      const panelVM = this.$refs.panels[this.panel]
      if (panelVM && panelVM.recalcScroll) {
        await this.$nextTick()
        panelVM.recalcScroll()
      }
    },

    /**
     * Update active tab for panel
     */
    updateActiveTab(i, tabs) {
      let active = tabs.find(t => t.active)
      if (active) {
        // Update active tab
        this.activeTabs[i] = active.id
      } else {
        // Remove tab from list of active tabs
        // if it no longer exists
        let lastActive = this.activeTabs[i]
        if (lastActive && !tabs.find(t => t.id === lastActive)) {
          this.activeTabs[i] = null
        }
      }
    },

    /**
     * Get panel index of tab
     */
    getPanelIndex(tabId) {
      if (tabId === null) {
        let t = this.allTabs.find(t => t.active)
        if (!t) return
        tabId = t.id
      }
      let panelIndex = this.panels.findIndex(p => {
        if (p.tabs && p.tabs.length) {
          return !!p.tabs.find(t => t.id === tabId)
        }
      })
      return panelIndex
    },

    /**
     * Get range info of panel by cookieStoreId
     * returns: [tab-length, start, end] or null
     */
    getPanelRangeInfo(ctxId) {
      let panel = this.panels.find(p => p.cookieStoreId === ctxId)
      if (!panel) return null
      return [panel.tabs.length, panel.startIndex, panel.endIndex]
    },

    /**
     * Create new tab
     */
    createTab(ctxId) {
      if (!ctxId) return
      let p = this.panels.find(p => p.cookieStoreId === ctxId)
      if (!p || !p.tabs) return
      let index = p.tabs.length ? p.endIndex + 1 : p.startIndex
      browser.tabs.create({ index, cookieStoreId: ctxId })
    },

    removeTab(tab) {
      let p = this.panels.find(p => p.cookieStoreId === tab.cookieStoreId)
      if (!p || !p.tabs) return
      if (tab.index === p.endIndex && p.tabs.length > 1) {
        let prevTab = this.allTabs[p.endIndex - 1]
        browser.tabs.update(prevTab.id, { active: true })
        this.$nextTick(() => {
          browser.tabs.remove(tab.id)
        })
      } else {
        browser.tabs.remove(tab.id)
      }
    },

    /**
     * Switch current active panel by index
     */
    switchToPanel(index) {
      if (this.settingsOpened) this.closeSettings()
      this.$root.closeCtxMenu()
      this.panel = index
      this.$root.activePanel = this.panel
      if (this.menuOpened) this.openMenu(this.panel)
      if (this.$root.createNewTabOnEmptyPanel) {
        let panel = this.panels[this.panel]
        if (panel.tabs && panel.tabs.length === 0) this.createTab(panel.cookieStoreId)
      }

      if (this.$root.activateLastTabOnPanelSwitching) {
        this.activateLastActiveTabOf(this.panel)
      }

      this.recalcPanelScroll()
    },

    /**
     * Switch to next panel
     */
    async switchToNextPanel() {
      // Debounce switching
      if (this.switchPanelPause) return
      this.switchPanelPause = setTimeout(() => {
        clearTimeout(this.switchPanelPause)
        this.switchPanelPause = null
      }, 128)

      Logs.D(`Switch to next panel, current: ${this.panel}`)

      this.$root.closeCtxMenu()
      if (this.settingsOpened) {
        this.closeSettings()
        this.panel = this.$root.activePanel
        return
      }

      if (this.panel < this.panels.length - 1) this.panel++
      let i = this.panel
      while (this.panels[i].hidden) {
        if (i >= this.panels.length - 1) {
          i = this.panel - 1
          break
        }
        i++
      }
      this.panel = i
      if (this.$root.skipEmptyPanels) {
        for (let i = this.panel; i < this.panels.length; i++) {
          if (this.panels[i].tabs && this.panels[i].tabs.length) {
            this.panel = i
            break
          }
        }
      }
      this.$root.activePanel = this.panel

      if (this.$root.activateLastTabOnPanelSwitching) {
        this.activateLastActiveTabOf(this.panel)
      }

      if (this.menuOpened) this.openMenu(this.panel)
      if (this.$root.createNewTabOnEmptyPanel) {
        let panel = this.panels[this.panel]
        if (panel.tabs && panel.tabs.length === 0) this.createTab(panel.cookieStoreId)
      }

      this.recalcPanelScroll()
    },

    /**
     * Switch to previous panel
     */
    async switchToPrevPanel() {
      // Debounce switching
      if (this.switchPanelPause) return
      this.switchPanelPause = setTimeout(() => {
        clearTimeout(this.switchPanelPause)
        this.switchPanelPause = null
      }, 128)

      Logs.D(`Switch to prev panel, current: ${this.panel}`)

      this.$root.closeCtxMenu()
      if (this.settingsOpened) {
        this.closeSettings()
        this.panel = this.$root.activePanel
        return
      }

      if (this.panel < 0) this.panel = 0
      if (this.panel > 0) this.panel--
      while (this.panels[this.panel].hidden) {
        this.panel--
      }
      if (this.$root.skipEmptyPanels) {
        for (let i = this.panel; i--; ) {
          if (this.panels[i].tabs && this.panels[i].tabs.length) {
            this.panel = i
            break
          }
        }
      }
      this.$root.activePanel = this.panel

      if (this.$root.activateLastTabOnPanelSwitching) {
        this.activateLastActiveTabOf(this.panel)
      }

      if (this.menuOpened) this.openMenu(this.panel)
      if (this.$root.createNewTabOnEmptyPanel) {
        let panel = this.panels[this.panel]
        if (panel.tabs && panel.tabs.length === 0) this.createTab(panel.cookieStoreId)
      }

      this.recalcPanelScroll()
    },

    async dragToNextPanel(drag) {
      if (this.panel >= this.panels.length - 1) return
      let panel = this.panels[this.panel + 1]
      let origPanel = this.panel + 1 === drag.origPanel

      if (origPanel) {
        this.drag = {
          ...drag,
          panel: this.panel + 1,
          x: drag.x + 30,
          i: drag.origIndex,
        }
      } else {
        let index = panel.endIndex + 1
        this.drag = {
          ...drag,
          panel: this.panel + 1,
          globalIndex: index,
          i: panel.tabs.length,
          x: drag.x + 30,
        }
      }

      if (!drag.origPanel) this.drag.origPanel = this.panel
      if (!drag.origIndex) this.drag.origIndex = drag.i

      this.$refs.panels[this.panel + 1].recalcDragTabs()
      if (this.drag.panel !== this.drag.origPanel) {
        this.$refs.panels[this.panel + 1].dragTabs.push(this.drag)
      }
      this.$refs.panels[this.panel + 1].drag = this.drag

      await this.$nextTick()
      this.switchToNextPanel()
    },

    async dragToPrevPanel(drag) {
      if (this.panel <= 2) return
      let panel = this.panels[this.panel - 1]
      let origPanel = this.panel - 1 === drag.origPanel

      if (origPanel) {
        this.drag = {
          ...drag,
          panel: this.panel - 1,
          x: drag.x - 30,
          i: drag.origIndex,
        }
      } else {
        let index = panel.endIndex + 1
        this.drag = {
          ...drag,
          panel: this.panel - 1,
          globalIndex: index,
          i: panel.tabs.length,
          x: drag.x - 30,
        }
      }

      if (!drag.origPanel) this.drag.origPanel = this.panel
      if (!drag.origIndex) this.drag.origIndex = drag.i

      this.$refs.panels[this.panel - 1].recalcDragTabs()
      if (this.drag.panel !== this.drag.origPanel) {
        this.$refs.panels[this.panel - 1].dragTabs.push(this.drag)
      }
      this.$refs.panels[this.panel - 1].drag = this.drag

      await this.$nextTick()
      this.switchToPrevPanel()
    },

    /**
     * Activate last active tab on panel
     */
    activateLastActiveTabOf(panelIndex) {
      // Last active tab
      if (typeof this.activeTabs[panelIndex] === 'number') {
        browser.tabs.update(this.activeTabs[panelIndex], { active: true })
        return
      }

      // Or last
      const p = this.panels[panelIndex]
      if (!p || !p.tabs) return
      const lastTab = p.tabs[p.tabs.length - 1]
      if (lastTab) browser.tabs.update(lastTab.id, { active: true })
    },

    /**
     * Get position class for panel by index.
     */
    getPanelPos(i) {
      if (this.settingsOpened) return 'left'
      if (this.panel < i) return 'right'
      if (this.panel === i) return 'center'
      if (this.panel > i) return 'left'
    },

    // --- Menu ---
    /**
     * Open panel menu by nav index.
     */
    async openMenu(i) {
      if (this.settingsOpened) this.closeSettings()
      this.$root.closeCtxMenu()
      this.menuOpened = true
      this.panel = i
      if (i >= 0) this.$root.activePanel = this.panel
      if (i === -1) this.menu = { menu: TabsMenu, new: true }
      else if (i >= 0) this.menu = { ...this.nav[i] }

      await this.$nextTick()
      if (this.$refs.menu && this.$refs.menu.open) this.$refs.menu.open()
      let h = this.$refs.menu.$el.offsetHeight
      this.$refs.nav.style.transform = `translateY(${h - 336}px)`
    },

    async recalcMenuHeight() {
      await this.$nextTick()
      if (!this.menuOpened) return
      let h = this.$refs.menu ? this.$refs.menu.$el.offsetHeight : 336
      this.$refs.nav.style.transform = `translateY(${h - 336}px)`
    },

    /**
     * Close panel menu.
     */
    closeMenu() {
      this.menuOpened = false
      if (this.panel < 0 && this.$root.activePanel >= 0) {
        this.panel = this.$root.activePanel
      }
      this.$refs.nav.style.transform = 'translateY(0px)'
      setTimeout(() => (this.menu = null), 120)
    },
    // ---

    // --- Settings ---
    /**
     * Open settings panel.
     */
    openSettings() {
      if (this.menuOpened) this.closeMenu()
      this.$root.closeCtxMenu()
      this.$root.activePanel = this.panel
      this.panel = -2
      this.settingsOpened = true
    },

    /**
     * Toggle settings
     */
    toggleSettings() {
      if (this.settingsOpened) this.closeSettings()
      else this.openSettings()
    },

    /**
     * Close settings panel and return to last one.
     */
    closeSettings() {
      this.settingsOpened = false
      this.panel = this.$root.activePanel
    },
    // ---

    /**
     * Run command in panel
     */
    panelCmd(name, func, ...args) {
      let i = this.panels.findIndex(p => p.name === name)
      if (i === -1) return
      if (this.$refs.panels[i][func]) this.$refs.panels[i][func](...args)
    },

    /**
     * Update sidebar width value.
     */
    updateNavSize() {
      if (this.width !== window.innerWidth) this.width = window.innerWidth
    },

    /**
     * Load Contextual Identities
     */
    async loadContexts() {
      this.contexts = await browser.contextualIdentities.query({})
    },

    /**
     * Load all tabs for current window
     */
    async loadTabs() {
      let tabs = await browser.tabs.query({
        windowId: browser.windows.WINDOW_ID_CURRENT,
        cookieStoreId: this.storeId,
      })

      // Check order of tabs and get moves for normalizing
      let ctxs = [this.$root.defaultCtx].concat(this.contexts.map(ctx => ctx.cookieStoreId))
      let moves = []
      let index = 0
      let offset = 0
      for (let i = 0; i < ctxs.length; i++) {
        const ctx = ctxs[i]
        for (let j = 0; j < tabs.length; j++) {
          const tab = tabs[j]
          if (tab.cookieStoreId !== ctx) continue

          if (tab.pinned) {
            index++
            continue
          }

          if (index !== tab.index + offset) {
            moves.push([tab.id, index])
            offset++
          }
          index++
        }
      }

      // Ask user for normalizing
      // ...

      this.allTabs = tabs

      // Normalize order
      moves.map(async move => {
        await browser.tabs.move(move[0], { index: move[1] })
      })
    },

    /**
     * Get current window id.
     */
    async loadWindowId() {
      const win = await browser.windows.getCurrent()
      this.winId = win.id
    },

    activateNextTab({ globaly, cycle }) {
      if (this.switchTabPause) return
      this.switchTabPause = setTimeout(() => {
        clearTimeout(this.switchTabPause)
        this.switchTabPause = null
      }, 50)

      let tabs = globaly ? this.allTabs : this.panels[this.panel].tabs
      if (!tabs || !tabs.length) return

      let current = tabs.findIndex(t => t.active)
      if (current < 0) return

      let next = current + 1
      if (next >= tabs.length) {
        if (cycle) next = 0
        else return
      }

      browser.tabs.update(tabs[next].id, { active: true })
    },

    activatePrevTab({ globaly, cycle }) {
      if (this.switchTabPause) return
      this.switchTabPause = setTimeout(() => {
        clearTimeout(this.switchTabPause)
        this.switchTabPause = null
      }, 50)

      let tabs = globaly ? this.allTabs : this.panels[this.panel].tabs
      if (!tabs || !tabs.length) return

      let current = tabs.findIndex(t => t.active)
      if (current < 0) return

      let prev = current - 1
      if (prev < 0) {
        if (cycle) prev = tabs.length - 1
        else return
      }

      browser.tabs.update(tabs[prev].id, { active: true })
    },

    closeTabsDown(panelIndex, tabIndex) {
      const panel = this.panels[panelIndex]
      if (!panel) return

      if (!panel.tabs || !panel.tabs[tabIndex]) return
      const tabs = panel.tabs.slice(tabIndex)
      if (panel.tabs[tabIndex - 1] && tabs.find(t => t.active)) {
        browser.tabs.update(panel.tabs[tabIndex - 1].id, { active: true })
      }

      browser.tabs.remove(tabs.map(t => t.id))
    },
  },
}
</script>


<style lang="stylus">
@import '../styles/mixins'

NAV_HEIGHT = 32px
NAV_BTN_WIDTH = 34px
NAV_CTRL_WIDTH = 28px
NAV_CONF_HEIGHT = auto

.Sidebar
  box(relative, flex)
  size(100%, same)
  flex-direction: column
  overflow: hidden

  &[data-menu]
    > .dimmer
      z-index: 999
      opacity: 1
    .panel-menu
      opacity: 1
      transition: opacity var(--d-fast), z-index var(--d-fast)
    .panel-btn[data-active="true"]
      flex-grow: 10
      transition: flex var(--d-fast)

// --- Parallaxed background ---
.Sidebar > .bg
  box(absolute)
  size(200%, 100%)
  transition: transform var(--d-fast)

// --- Dimmer layer ---
.Sidebar > .dimmer
  box(absolute)
  pos(0, 0)
  size(100%, same)
  background-color: #24242464
  z-index: -1
  opacity: 0
  transition: z-index var(--d-fast), opacity var(--d-fast)

// --- Nav panel ---
.Sidebar > .nav
  box(relative, flex)
  size(100%, NAV_HEIGHT)
  z-index: 1000
  transform: translateY(0)
  transition: transform var(--d-fast)

.Sidebar .panel-menu
  box(absolute)
  pos(b: 0, l: 0)
  size(100%, NAV_CONF_HEIGHT)
  padding: 300px 0 36px
  background-color: var(--c-bg)
  box-shadow: 0 1px 12px 0 #00000056, 0 1px 0 0 #00000012
  opacity: 0
  z-index: 0
  transition: opacity var(--d-fast) .03s, z-index var(--d-fast)

.Sidebar .nav-strip
  box(relative, flex)
  flex-grow: 1
  overflow: hidden

.Sidebar .panel-btn
  box(relative, flex)
  size(NAV_BTN_WIDTH, NAV_HEIGHT, max-w: 34px)
  justify-content: center
  align-items: center
  flex-shrink: 0
  opacity: var(--nav-btn-opacity)
  z-index: 10
  transition: opacity var(--d-fast), width var(--d-fast), z-index var(--d-fast)
  &[data-active="true"]
    opacity: var(--nav-btn-activated-opacity)
  &:hover
    opacity: var(--nav-btn-opacity-hover)
  &:active
    opacity: var(--nav-btn-opacity-active)
    transition: none
  &[data-hidden="true"]
    size(0)
    opacity: 0
    z-index: -1

.Sidebar .panel-btn > svg
  box(absolute)
  size(16px, same)
  fill: var(--nav-btn-fg)
  tranform: translateZ(0)
  transition: opacity var(--d-fast)

.Sidebar .add-btn
.Sidebar .settings-btn
  box(relative, flex)
  size(NAV_CTRL_WIDTH, NAV_HEIGHT)
  justify-content: center
  align-items: center
  flex-shrink: 0
  &:hover > svg
    opacity: .7
  &:active > svg
    transition: none
    opacity: .4
  > svg
    box(absolute)
    size(16px, same)
    fill: var(--c-act-fg)
    opacity: .4
    transition: opacity var(--d-fast)

.Sidebar .add-btn
  margin: 0 0 0 auto
.Sidebar .settings-btn
  margin: 0 3px 0 0
  &[data-active="true"]
    > svg
      opacity: 1

// --- Panel ---
.Sidebar > .panel-box
  box(relative)
  flex-grow: 2

.Sidebar .panel
  box(absolute)
  pos(0, 0)
  size(100%, same)
  transition: transform var(--d-fast), opacity var(--d-fast), z-index var(--d-fast)
  opacity: 0
  z-index: 0
  &[pos="center"]
    z-index: 10
    opacity: 1
    transform: translateX(0)
  &[pos="left"]
    transform: translateX(-100%)
  &[pos="right"]
    transform: translateX(100%)
</style>
