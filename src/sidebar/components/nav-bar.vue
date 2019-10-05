<template lang="pug">
.nav(v-noise:300.g:12:af.a:0:42.s:0:9="" ref="nav")
  .nav-bar(@wheel.stop.prevent="onNavWheel")
    .nav-btn(
      v-for="(btn, i) in nav"
      :key="btn.cookieStoreId + btn.name"
      :data-loading="btn.loading"
      :data-updated="$store.state.panelIndex !== i && !!btn.updated && !!btn.updated.length"
      :data-proxified="btn.proxified"
      :data-active="$store.state.panelIndex === i"
      :data-hidden="btn.hidden"
      :data-index="btn.relIndex"
      :data-color="btn.color"
      :title="btn.tooltip || getTooltip(i)"
      @click="onNavClick(i, btn.type)"
      @dragenter="onNavDragEnter(i)"
      @dragleave="onNavDragLeave(i)"
      @mousedown.middle="onNavMidClick(btn)"
      @mousedown.right="onNavRightClick(i, btn.type)")
      svg: use(:xlink:href="'#' + btn.icon")
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
import { translate } from '../../mixins/dict.js'
import EventBus from '../../event-bus'
import State from '../store/state.js'
import Actions from '../actions'

const HIDDEN_CTR_BTN = {
  type: 'hidden',
  name: 'hidden',
  icon: 'icon_expand',
  hidden: false,
  tooltip: translate('nav.show_hidden_tooltip'),
}

export default {
  data: function() {
    return {
      width: 0
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

      for (i = 0; i < State.panels.length; i++) {
        const btn = State.panels[i]
        btn.len = btn.tabs ? btn.tabs.length : State.bookmarksCount
        btn.hidden = false
        btn.inactive = false

        if (!State.bookmarksPanel && btn.bookmarks) {
          btn.hidden = true
          btn.inactive = true
        }

        if (State.hideEmptyPanels && btn.tabs && !btn.tabs.length && State.panelIndex !== i) {
          btn.hidden = true
          btn.inactive = true
          emptyPanel = true
        }

        out.push(btn)
      }

      if (emptyPanel && State.hideEmptyPanels) {
        HIDDEN_CTR_BTN.hidden = false
        out.push(HIDDEN_CTR_BTN)
      }

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
     * Navigation button click hadler
     */
    onNavClick(i, type) {
      if (type === 'hidden') {
        State.hiddenPanelsBar = true
        return
      }

      if (State.panelIndex !== i) return Actions.switchToPanel(i)

      if (State.panels[i].bookmarks) return EventBus.$emit('scrollBookmarksToEdge')

      if (State.panels[i].cookieStoreId) {
        browser.tabs.create({
          windowId: State.windowId,
          cookieStoreId: State.panels[i].cookieStoreId,
        })
      }
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
        if (!btn.tabs || !btn.tabs.length) return
        Actions.removeTabs(btn.tabs.map(t => t.id))
      }
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
        if (State.hiddenPanelsBar) State.hiddenPanelsBar = false
        Actions.switchToPanel(i)
      }, 300)
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

    /**
     * Get tooltip for button
     */
    getTooltip(i) {
      if (i === State.panels.length) return this.t('nav.add_ctx_tooltip')
      if (!State.panels[i].tabs) return this.nav[i].name
      return `${this.nav[i].name}: ${State.panels[i].tabs.length}`
    },
  },
}
</script>