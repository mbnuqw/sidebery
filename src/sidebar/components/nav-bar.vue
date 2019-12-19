<template lang="pug">
.nav(v-noise:300.g:12:af.a:0:42.s:0:9="" ref="nav" @dragleave="onDragLeave" @dragenter="onDragEnter")
  .nav-bar(@wheel.stop.prevent="onNavWheel")
    .nav-btn(
      v-for="(btn, i) in nav"
      :key="btn.id"
      :data-loading="btn.loading"
      :data-updated="$store.state.panelIndex !== i && !!btn.updated && !!btn.updated.length"
      :data-active="$store.state.panelIndex === i"
      :data-hidden="btn.hidden"
      :data-index="btn.relIndex"
      :data-color="btn.color"
      :data-type="btn.type"
      :title="btn.tooltip || btn.name"
      @click="onNavClick(i, btn.type)"
      @drop="onPanelDrop($event, btn)"
      @dragenter="onNavDragEnter(i)"
      @dragleave="onNavDragLeave(i)"
      @contextmenu.stop="onNavCtxMenu($event, i)"
      @mousedown.middle="onNavMidClick(btn)"
      @mousedown.right="onNavRightClick(i, btn.type)"
      @mouseup.right="onNavRightMouseup($event, i)")
      img(v-if="!!btn.customIcon" :src="btn.customIcon")
      svg(v-else): use(:xlink:href="'#' + btn.icon")
      .proxy-badge
        svg: use(xlink:href="#icon_proxy")
      .update-badge
      .ok-badge
        svg: use(xlink:href="#icon_ok")
      .err-badge
        svg: use(xlink:href="#icon_err")
      .progress-spinner
      .len(v-if="$store.state.navBtnCount && btn.len") {{btn.len}}

  //- Settings
  .settings-btn(
    v-if="!$store.state.hideSettingsBtn"
    :title="t('nav.settings_tooltip')"
    @click="act('openSettings')")
    svg: use(xlink:href="#icon_settings")
</template>

<script>
import { translate } from '../../../addon/locales/dict.js'
import { TABS_PANEL_STATE } from '../../../addon/defaults'
import EventBus from '../../event-bus'
import State from '../store/state.js'
import { getters } from '../store'
import Actions from '../actions'

const HIDDEN_PANEL_BTN = {
  type: 'hidden',
  name: 'hidden',
  id: 'hidden',
  icon: 'icon_expand',
  hidden: false,
  tooltip: translate('nav.show_hidden_tooltip'),
}

const ADD_PANEL_BTN = {
  type: 'add',
  name: 'add',
  id: 'add',
  icon: 'icon_plus_v2',
  hidden: false,
  tooltip: translate('nav.add_panel_tooltip'),
}

export default {
  data: function() {
    return {
      width: 0,
    }
  },

  computed: {
    /**
     * Get list of navigational buttons
     */
    nav() {
      let cap = ~~(State.width / State.navBtnWidth)
      if (!State.hideSettingsBtn) cap -= 1

      let i, r
      let out = []
      let emptyPanel = false
      let pinnedTabs

      for (i = 0; i < State.panels.length; i++) {
        const btn = State.panels[i]
        btn.len = btn.tabs ? btn.tabs.length : State.bookmarksCount
        btn.hidden = false
        btn.inactive = false

        if (!State.bookmarksPanel && btn.bookmarks) {
          btn.hidden = true
          btn.inactive = true
        }

        if (btn.tabs && State.pinnedTabsPosition === 'panel') {
          let pinned = getters.pinnedTabs.filter(t => t.panelId === btn.id)
          pinnedTabs = pinned.length > 0
          btn.len += pinned.length
        }

        if (
          State.hideEmptyPanels &&
          btn.tabs &&
          !btn.tabs.length &&
          State.panelIndex !== i &&
          !pinnedTabs
        ) {
          btn.hidden = true
          btn.inactive = true
          emptyPanel = true
        }

        out.push(btn)
      }

      if (emptyPanel && State.hideEmptyPanels) {
        HIDDEN_PANEL_BTN.hidden = false
        out.push(HIDDEN_PANEL_BTN)
      }

      if (!State.hideAddBtn) out.push(ADD_PANEL_BTN)

      if (!State.navBarInline) return out

      let index
      let p = State.panelIndex
      let n = State.panelIndex
      let dir = 1
      while (p >= 0 || n < out.length) {
        if (dir > 0) index = ++n
        else index = --p

        if (!out[index]) {
          dir *= -1
          continue
        }

        if (out[index].hidden) continue
        if (cap <= 1) out[index].hidden = true

        cap--
        dir *= -1
      }

      r = 0
      for (let btn of out) {
        if (!btn.hidden) btn.relIndex = r++
      }

      return out
    },
  },

  methods: {
    /**
     * Navigation wheel event handler
     */
    onNavWheel(e) {
      if (State.navSwitchPanelsWheel) {
        if (e.deltaY > 0) return Actions.switchPanel(1)
        if (e.deltaY < 0) return Actions.switchPanel(-1)
      }
    },

    /**
     * Handle context menu event
     */
    onNavCtxMenu(e, i) {
      if (!State.ctxMenuNative || e.ctrlKey || e.shiftKey) {
        e.stopPropagation()
        e.preventDefault()
        return
      }

      let panel = State.panels[i]
      if (!panel) return

      if (State.ctxMenuBlockTimeout) {
        e.stopPropagation()
        e.preventDefault()
        return
      }

      let nativeCtx = { showDefaults: false }
      browser.menus.overrideContext(nativeCtx)

      let type
      if (panel.type === 'bookmarks') type = 'bookmarksPanel'
      else if (panel.type === 'default') type = 'tabsPanel'
      else if (panel.type === 'tabs') type = 'tabsPanel'
      if (!State.selected.length) State.selected = [panel]

      Actions.openCtxMenu(type)
    },

    /**
     * Navigation button click hadler
     */
    onNavClick(i, type) {
      if (type === 'hidden') {
        State.hiddenPanelsBar = true
        return
      }
      if (type === 'add') {
        let panel = Utils.cloneObject(TABS_PANEL_STATE)
        panel.id = Utils.uid()
        panel.name = 'New Panel ' + (State.panels.length + 1)
        State.panels.push(panel)
        State.panelsMap[panel.id] = panel
        Actions.savePanels()
        Actions.updatePanelsTabs()
        State.panelIndex = State.panels.length - 1
        return
      }

      if (State.panelIndex !== i) return Actions.switchToPanel(i)
      if (State.panels[i].bookmarks) return EventBus.$emit('scrollBookmarksToEdge')
      if (State.panels[i].tabs) return Actions.createTabInPanel(State.panels[i])
    },

    /**
     * Nav button right click handler
     */
    onNavRightClick(i, type) {
      if (type === 'hidden') State.hiddenPanelsBar = true
    },

    /**
     * Handle middle click on nav button
     */
    onNavMidClick(btn) {
      if (State.navMidClickAction === 'rm_all') {
        if (!btn.tabs) return
        let toRemove = btn.tabs.map(t => t.id)
        if (State.pinnedTabsPosition === 'panel') {
          for (let pinned of getters.pinnedTabs) {
            if (pinned.panelId === btn.id) toRemove.push(pinned.id)
          }
        }

        if (toRemove.length) Actions.removeTabs(toRemove)
      }
    },

    /**
     * Handle right mouseup event
     */
    onNavRightMouseup(e, i) {
      if (State.selected.length) return Actions.resetSelection()

      let panel = State.panels[i]
      if (!panel) return

      e.stopPropagation()

      let type
      if (panel.type === 'bookmarks') type = 'bookmarksPanel'
      else if (panel.type === 'default') type = 'tabsPanel'
      else if (panel.type === 'tabs') type = 'tabsPanel'

      State.selected = [panel]
      Actions.openCtxMenu(type, e.clientX, e.clientY)
    },

    /**
     * Navigation button dragenter handler
     */
    onNavDragEnter(i) {
      if (i > this.nav.length) return

      this.navDragEnterIndex = i
      if (this.navDragEnterTimeout) clearTimeout(this.navDragEnterTimeout)
      this.navDragEnterTimeout = setTimeout(() => {
        this.navDragEnterTimeout = null
        if (this.nav[i].type === 'hidden') {
          State.hiddenPanelsBar = true
          return
        }
        if (this.nav[i].type === 'add') return
        if (State.hiddenPanelsBar) State.hiddenPanelsBar = false
        Actions.switchToPanel(i)
      }, 500)
    },

    /**
     * Navigation button dragleave handler
     */
    onNavDragLeave(i) {
      if (i >= this.nav.length - 1) return
      if (this.navDragEnterTimeout && this.navDragEnterIndex === i) {
        clearTimeout(this.navDragEnterTimeout)
      }
    },

    onDragEnter(event) {
      this.enteredTarget = event.target
    },

    onDragLeave(event) {
      if (this.enteredTarget === event.target) {
        clearTimeout(this.navDragEnterTimeout)
      }
    },

    /**
     * Drop to panel's button
     */
    onPanelDrop(event, panel) {
      event.stopPropagation()
      event.preventDefault()
      if (!State.dragNodes || !State.dragNodes.length) return
      let firstNode = State.dragNodes[0]
      let ids = State.dragNodes.map(n => n.id)
      if (typeof firstNode.id === 'number') {
        State.panelIndex = panel.index
        if (panel.newTabCtx !== 'none' && panel.newTabCtx !== firstNode.ctx) {
          Actions.recreateDroppedNodes(
            null,
            panel.endIndex + 1,
            -1,
            State.dragNodes,
            false,
            panel.newTabCtx
          )
        } else {
          Actions.moveDroppedNodes(panel.endIndex + 1, -1, State.dragNodes, false, panel)
        }
      }
      if (typeof firstNode.id === 'string') {
        Actions.openBookmarksInCtx(ids, panel.cookieStoreId)
      }
    },
  },
}
</script>
