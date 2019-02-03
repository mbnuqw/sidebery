<template lang="pug">
.Tab(:data-active="tab.active"
  :data-status="tab.status"
  :data-no-fav="!favicon || faviErr"
  :data-audible="tab.audible"
  :data-muted="tab.mutedInfo.muted"
  :data-menu="menu || selected"
  :data-pinned="tab.pinned"
  :discarded="tab.discarded"
  :updated="updated"
  :is-parent="tab.isParent"
  :folded="tab.folded"
  :lvl="tab.lvl"
  :dragged="dragged"
  :close-btn="$store.state.showTabRmBtn"
  :title="tooltip"
  @contextmenu.prevent.stop=""
  @mousedown="onMouseDown"
  @mouseup.prevent="onMouseUp"
  @mouseleave="onMouseLeave"
  @dblclick.prevent.stop="onDoubleClick"): .lvl-wrapper
  .drag-layer(draggable="true"
    @dragstart="onDragStart"
    @dragenter="onDragEnter"
    @dragleave="onDragLeave")
  .audio(@mousedown.stop="", @click="$store.dispatch('remuteTabs', [tab.id])")
    svg.-loud: use(xlink:href="#icon_loud")
    svg.-mute: use(xlink:href="#icon_mute")
  .fav(:loading="loading")
    .placeholder
    img(:src="favicon", @load.passive="onFaviconLoad", @error="onFaviconErr")
    .exp(@mousedown.stop="onExp"): svg: use(xlink:href="#icon_expand")
    .update-badge
    .ok-badge
      svg: use(xlink:href="#icon_ok")
    .err-badge
      svg: use(xlink:href="#icon_err")
    .loading-spinner
      each n in [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]
        .spinner-stick(class='spinner-stick-' + n)
  .ctx(v-if="tab.ctxIcon", :style="{background: tab.ctxColor}")
  .close(v-if="$store.state.showTabRmBtn", @mousedown.stop="close", @mouseup.stop="")
    svg: use(xlink:href="#icon_remove")
  .t-box
    .title {{tab.id}} - [{{tab.index}}] - {{tab.title}}
    .loading
      svg.-a: use(xlink:href="#icon_load")
      svg.-b: use(xlink:href="#icon_load")
      svg.-c: use(xlink:href="#icon_load")
</template>


<script>
import { mapGetters } from 'vuex'
import Utils from '../../../libs/utils'
import Store from '../../store'
import State from '../../store.state'
import EventBus from '../../event-bus'
import CtxMenu from '../../context-menu'

export default {
  props: {
    tab: {
      type: Object,
      default: () => ({}),
    },
    selected: Boolean,
  },

  data() {
    return {
      menu: false,
      faviErr: false,
      loading: false,
      dragged: false,
    }
  },

  computed: {
    ...mapGetters(['showTabRmBtn']),

    updated() {
      return !!State.updatedTabs[this.tab.id]
    },

    favicon() {
      if (this.tab.favIconUrl) return this.tab.favIconUrl
      else if (this.tab.url) {
        let hn = this.tab.url.split('/')[2]
        if (!hn) return
        return State.favicons[hn]
      }
      return undefined
    },

    offsetStyle() {
      if (!this.offsetY) return {}
      return { transform: `translateY(${this.offsetY}px)` }
    },

    tooltip() {
      return `${this.tab.title}\n${this.tab.url}`
    },
  },

  created() {
    EventBus.$on('tabLoadingStart', id => {
      if (id === this.tab.id) this.loadingStart()
    })
    EventBus.$on('tabLoadingEnd', id => {
      if (id === this.tab.id) this.loadingEnd()
    })
    EventBus.$on('tabLoadingOk', id => {
      if (id === this.tab.id) this.loadingOk()
    })
    EventBus.$on('tabLoadingErr', id => {
      if (id === this.tab.id) this.loadingErr()
    })
    EventBus.$on('dragEnd', () => {this.dragged = false})
  },

  methods: {
    /**
     * Double click handler
     */
    onDoubleClick() {
      let dc = State.tabDoubleClick
      if (dc === 'reload') Store.dispatch('reloadTabs', [this.tab.id])
      if (dc === 'duplicate') Store.dispatch('duplicateTabs', [this.tab.id])
      if (dc === 'pin') Store.dispatch('repinTabs', [this.tab.id])
      if (dc === 'mute') Store.dispatch('remuteTabs', [this.tab.id])
      if (dc === 'clear_cookies') Store.dispatch('clearTabsCookies', [this.tab.id])
    },

    /**
     * Mousedown handler
     */
    onMouseDown(e) {
      if (e.button === 1) {
        this.close()
        e.preventDefault()
        e.stopPropagation()
      }

      if (e.button === 0) {
        this.$emit('mdl', e, this)
        this.hodorL = setTimeout(() => {
          let llc = State.tabLongLeftClick
          if (llc === 'reload') Store.dispatch('reloadTabs', [this.tab.id])
          if (llc === 'duplicate') Store.dispatch('duplicateTabs', [this.tab.id])
          if (llc === 'pin') Store.dispatch('repinTabs', [this.tab.id])
          if (llc === 'mute') Store.dispatch('remuteTabs', [this.tab.id])
          if (llc === 'clear_cookies') Store.dispatch('clearTabsCookies', [this.tab.id])
          this.hodorL = null
        }, 250)

        Store.commit('closeCtxMenu')
        Store.commit('resetSelection')
      }

      if (e.button === 2) {
        e.preventDefault()
        e.stopPropagation()
        this.$emit('mdr', e, this)
        this.hodorR = setTimeout(() => {
          let lrc = State.tabLongRightClick
          if (lrc === 'reload') Store.dispatch('reloadTabs', [this.tab.id])
          if (lrc === 'duplicate') Store.dispatch('duplicateTabs', [this.tab.id])
          if (lrc === 'pin') Store.dispatch('repinTabs', [this.tab.id])
          if (lrc === 'mute') Store.dispatch('remuteTabs', [this.tab.id])
          if (lrc === 'clear_cookies') Store.dispatch('clearTabsCookies', [this.tab.id])
          this.hodorR = null
        }, 250)

        Store.commit('resetSelection')
      }
    },

    onMouseUp(e) {
      if (e.button === 0) {
        if (this.hodorL) this.hodorL = clearTimeout(this.hodorL)
      }
      if (e.button === 2) {
        if (this.hodorR) {
          this.openMenu()
          this.hodorR = clearTimeout(this.hodorR)
        }
      }
    },

    onMouseLeave() {
      if (this.hodorL) this.hodorL = clearTimeout(this.hodorL)
      if (this.hodorR) this.hodorR = clearTimeout(this.hodorR)
    },

    /**
     * Handle dragstart event.
     */
    onDragStart(e) {
      e.dataTransfer.setData('text/x-moz-text-internal', this.tab.url)
      e.dataTransfer.setData('text/uri-list', this.tab.url)
      e.dataTransfer.setData('text/plain', this.tab.url)
      e.dataTransfer.effectAllowed = 'move'
      const info = [{
        type: 'tab',
        id: this.tab.id,
        index: this.tab.index,
        ctx: this.tab.cookieStoreId,
        incognito: State.private,
        windowId: State.windowId,
        panel: State.panelIndex,
        url: this.tab.url,
        title: this.tab.title,
      }]
      EventBus.$emit('dragStart', info)
      Store.dispatch('broadcast', {
        name: 'outerDragStart',
        arg: info,
      })
      this.dragged = true
    },

    /**
     * Handle dragenter event
     */
    onDragEnter() {
      if (this.dragEnterTimeout) clearTimeout(this.dragEnterTimeout)
      this.dragEnterTimeout = setTimeout(() => {
        browser.tabs.update(this.tab.id, { active: true })
        this.dragEnterTimeout = null
      }, 200)
    },

    /**
     * Handle dragleave event
     */
    onDragLeave() {
      if (this.dragEnterTimeout) {
        clearTimeout(this.dragEnterTimeout)
        this.dragEnterTimeout = null
      }
    },

    /**
     * If favicon is just url to some image,
     * wait until it is loaded, convert to base64 and
     * store result to cache.
     */
    onFaviconLoad(e) {
      if (!this.favicon) return
      if (this.favicon.startsWith('http')) {
        let canvas = document.createElement('canvas')
        let ctx = canvas.getContext('2d')
        canvas.width = e.target.naturalWidth
        canvas.height = e.target.naturalHeight
        ctx.imageSmoothingEnabled = false
        ctx.drawImage(e.target, 0, 0, e.target.naturalWidth, e.target.naturalHeight)
        let base64 = canvas.toDataURL('image/png')
        let hn = this.tab.url.split('/')[2]
        if (!hn) return
        Store.dispatch('setFavicon', { hostname: hn, icon: base64 })
      }
    },

    onFaviconErr() {
      this.faviErr = true
    },

    onExp() {
      Store.dispatch('toggleBranch', this.tab.id)
    },

    close() {
      Store.dispatch('removeTab', this.tab)
    },

    async openMenu() {
      if (this.menu) return
      this.menu = true

      const otherWindows = (await Utils.GetAllWindows()).filter(w => !w.current)
      const menu = new CtxMenu(this.$el, this.closeMenu)

      // Move to new window
      let args = { tabIds: [this.tab.id] }
      menu.add('tab.move_to_new_window', 'moveTabsToNewWin', args)

      // Move to new private window
      args = { tabIds: [this.tab.id], incognito: true }
      menu.add('tab.move_to_new_priv_window', 'moveTabsToNewWin', args)

      // Move to another window
      if (otherWindows.length === 1) {
        const args = { tabIds: [this.tab.id], window: otherWindows[0] }
        menu.add('tab.move_to_another_window', 'moveTabsToWin', args)
      }

      // Move to window...
      if (otherWindows.length > 1) {
        menu.add('tab.move_to_window_', 'moveTabsToWin', { tabIds: [this.tab.id] })
      }

      // Default window
      if (!State.private) {
        // Reopen in containers
        if (this.tab.cookieStoreId !== 'firefox-default') {
          const args = { tabIds: [this.tab.id], ctxId: 'firefox-default'}
          menu.add('tab.reopen_in_default_panel', 'moveTabsToCtx', args)
        }
        State.ctxs.map(c => {
          if (this.tab.cookieStoreId === c.cookieStoreId) return
          const args = { tabIds: [this.tab.id], ctxId: c.cookieStoreId}
          const label = this.t('menu.tab.reopen_in_') + `||${c.colorCode}>>${c.name}`
          menu.addTranslated(label, 'moveTabsToCtx', args)
        })
      }

      if (!this.tab.pinned) menu.add('tab.pin', 'pinTabs', [this.tab.id])
      else menu.add('tab.unpin', 'unpinTabs', [this.tab.id])
      if (!this.tab.mutedInfo.muted) menu.add('tab.mute', 'muteTabs', [this.tab.id])
      else menu.add('tab.unmute', 'unmute', [this.tab.id])
      menu.add('tab.discard', 'discardTabs', [this.tab.id])
      menu.add('tab.reload', 'reloadTabs', [this.tab.id])
      menu.add('tab.duplicate', 'duplicateTabs', [this.tab.id])
      menu.add('tab.clear_cookies', 'clearTabsCookies', [this.tab.id])

      Store.commit('closeCtxMenu')
      State.ctxMenu = menu
    },

    closeMenu() {
      this.menu = false
    },

    loadingStart() {
      this.loading = true
      if (this.loadingTimer) {
        clearTimeout(this.loadingTimer)
        this.loadingTimer = null
      }
    },

    loadingEnd() {
      this.loading = false
    },

    loadingOk() {
      this.loading = 'ok'
      this.loadingTimer = setTimeout(() => {
        this.loadingEnd()
        this.loadingTimer = null
      }, 2000)
    },

    loadingErr() {
      this.loading = 'err'
      this.loadingTimer = setTimeout(() => {
        this.loadingEnd()
        this.loadingTimer = null
      }, 2000)
    },

    height() {
      return this.$el.offsetHeight
    },
  },
}
</script>


<style lang="stylus">
@import '../../../styles/mixins'


.Tab
  box(relative, flex)
  height: var(--tabs-height)
  align-items: center
  transform: translateZ(0)
  transition: opacity var(--d-fast), transform .12s, z-index 0s .2s, background-color var(--d-fast)
  &:hover
    .fav
      opacity: 1
    .title
      color: var(--tabs-fg-hover)
    .close
      opacity: 1
      z-index: 20

  &[lvl="1"]
    padding-left: var(--tabs-indent)
  &[lvl="2"]
    padding-left: calc(var(--tabs-indent) * 2)
  &[lvl="3"]
    padding-left: calc(var(--tabs-indent) * 3)
  &[lvl="4"]
    padding-left: calc(var(--tabs-indent) * 4)
  &[lvl="5"]
    padding-left: calc(var(--tabs-indent) * 5)

  &[is-parent] .fav:hover
    > .placeholder
    > img
      opacity: .2
    > .exp
      z-index: 1
      opacity: 1

  &[folded]
    .fav > .placeholder
    .fav > img
      opacity: .2
    .fav > .exp
      z-index: 1
      opacity: 1
      transform: rotateZ(-90deg)

  &[data-active]
    background-color: var(--tabs-activated-bg)
    .fav
      opacity: 1
    .title
      color: var(--tabs-activated-fg)

  &[dragged]
    z-index: 10
    background-color: var(--tabs-selected-bg)
    .title
      color: var(--tabs-selected-fg)

  &[close-btn]:hover
    &[data-audible] .t-box
    &[data-muted] .t-box
      mask: linear-gradient(-90deg, transparent, transparent 42px, #000000 64px, #000000)
    .t-box
      mask: linear-gradient(-90deg, transparent, transparent 24px, #000000 48px, #000000)
  
  &[data-status="loading"]
    cursor: progress
    .title
      transform: translateX(9px)
    .loading > svg.-a
      animation: tab-loading .8s infinite
    .loading > svg.-b
      animation: tab-loading .8s .07s infinite
    .loading > svg.-c
      animation: tab-loading .8s .14s infinite

  &[data-no-fav]
    .fav > .placeholder
      opacity: 1
      transform: translateY(0)
    .fav > img
      opacity: 0
      transform: translateY(-4px)

  &[data-audible]
    .audio
      opacity: 1
      z-index: 20
      transform: translateX(0)
    // .fav
    .t-box
      transform: translateX(16px)
    .t-box
      mask: linear-gradient(-90deg, transparent, transparent 16px, #000000 28px, #000000)

  &[data-muted]
    .audio
      opacity: .8
      z-index: 20
      transform: translateX(0)
      > svg.-loud
        opacity: 0
      > svg.-mute
        opacity: 1
    // .fav
    .t-box
      transform: translateX(16px)
    .t-box
      mask: linear-gradient(-90deg, transparent, transparent 16px, #000000 28px, #000000)

  &[data-menu]
    z-index: 10
    background-color: var(--tabs-selected-bg)
    .title
      color: var(--tabs-selected-fg)
  
  &[discarded]
    opacity: .5

  &[updated] .fav
    > img
      mask: radial-gradient(
        circle at calc(100% - 2px) calc(100% - 2px),
        #00000032,
        #00000032 4.5px,
        #000000 5.5px,
        #000000
      )
    > .update-badge
      opacity: 1
      transform: scale(1, 1)

// --- Level Wrapper
.Tab .lvl-wrapper
  box(relative, flex)
  size(100%, same)
  align-items: center

// --- Drag layer ---
.Tab .drag-layer
  box(absolute)
  size(100%, same)
  pos(0, 0)
  z-index: 15

// --- Audio ---
.Tab .audio
  box(absolute)
  pos(0, 24px)
  size(16px, 100%)
  z-index: 1
  opacity: 0
  transform: translateX(-100%)
  transition: opacity var(--d-fast), transform var(--d-fast)

  > svg
    box(absolute)
    pos(9px, 6px)
    size(11px, same)
    fill: var(--tabs-fg)
    transition: opacity var(--d-fast)

  > svg.-mute
    opacity: 0

// --- Favicon ---
.Tab .fav
  box(relative)
  size(16px, same)
  flex-shrink: 0
  margin: 0 6px 0 7px
  opacity: 1
  z-index: 20
  transition: opacity var(--d-fast), transform var(--d-fast)
  &[loading="true"]
    cursor: progress
    > .loading-spinner
      opacity: 1
      for i in 0..12
        > .spinner-stick-{i}
          animation: loading-spin .6s (i*50)ms infinite
  &[loading="ok"]
    > .ok-badge
      opacity: 1
      transform: scale(1, 1)
  &[loading="err"]
    > .err-badge
      opacity: 1
      transform: scale(1, 1)
  &[loading]
    > img
      mask: radial-gradient(
        circle at calc(100% - 2px) calc(100% - 2px),
        #00000032,
        #00000032 6.5px,
        #000000 7.5px,
        #000000
      )

.Tab .fav > .placeholder
  box(absolute)
  size(3px, same)
  pos(7px, 6px)
  border-radius: 50%
  background-color: var(--favicons-placehoder-bg)
  opacity: 0
  transform: translateY(4px)
  transition: opacity var(--d-fast), transform var(--d-fast)
  &:before
  &:after
    content: ''
    box(absolute)
    size(3px, same)
    border-radius: 6px
    background-color: var(--favicons-placehoder-bg)
  &:before
    pos(0, -5px)
  &:after
    pos(0, 5px)

.Tab .fav > img
  box(absolute)
  size(100%, same)
  transition: opacity var(--d-fast), transform var(--d-fast)

.Tab .fav > .exp
  box(absolute)
  size(100%, same)
  opacity: 0
  z-index: -1
  cursor: pointer
  transition: opacity var(--d-fast), transform var(--d-fast)
  > svg
    box(absolute)
    pos(1px, same)
    size(14px, same)
    fill: var(--bookmarks-folder-open-fg)

.Tab .fav > .loading-spinner
  box(absolute)
  size(10px, same)
  pos(b: -4px, r: -3px)
  border-radius: 50%
  opacity: 0
  transition: opacity var(--d-norm)

  > .spinner-stick
    box(absolute)
    size(1px, 3px)
    pos(calc(50% - 1px), calc(50% - 1px))
    transform-origin: 50% 0%
    opacity: 0

    &:before
      box(absolute)
      pos(2.5px, 0)
      size(100%, same)
      background-color: #278dff
      content: ''
  for i in 0..12
    > .spinner-stick-{i}
      transform: rotateZ((i * 30)deg)
      animation: none

.Tab .fav > .update-badge
  box(absolute)
  size(6px, same)
  pos(b: -1px, r: -1px)
  border-radius: 50%
  background-color: var(--tabs-update-badge-bg)
  opacity: 0
  transform: scale(0.7, 0.7)
  transition: opacity var(--d-norm), transform var(--d-norm)

.Tab .fav > .ok-badge
.Tab .fav > .err-badge
  box(absolute)
  size(10px, same)
  pos(b: -3px, r: -3px)
  border-radius: 50%
  opacity: 0
  transform: scale(0.7, 0.7)
  transition: opacity var(--d-norm), transform var(--d-norm)
  > svg
    box(absolute)
    size(100%, same)

.Tab .fav > .ok-badge > svg
  fill: var(--true-fg)

.Tab .fav > .err-badge > svg
  fill: var(--false-fg)


// --- Context highlight
.Tab .ctx
  box(absolute)
  pos(b: 10px, l: 0px)
  size(2px, 10px)
  z-index: 2000
  box-shadow: 0 0 2px 0 #00000024

// --- Title box ---
.Tab .t-box
  box(relative)
  size(100%)
  transition: opacity var(--d-fast), transform var(--d-fast)
  overflow: hidden
  mask: linear-gradient(-90deg, transparent, #000000 12px, #000000)

// Title
.Tab .title
  box(relative)
  text(s: rem(16), h: 28px)
  color: var(--tabs-fg)
  padding: 0 1px
  transition: color .2s
  white-space: nowrap
  overflow: hidden
  transition: transform var(--d-fast), color var(--d-fast), mask var(--d-fast)

// Loading
.Tab .loading
  box(absolute)
  pos(0, 0)
  size(3px, 100%)
  transition: transform var(--d-fast)

  > svg
    box(absolute)
    pos(9px)
    size(5px, 3px)
    fill: var(--tabs-loading-fg)
    opacity: 0
  > svg.-b
    pos(13px)
  > svg.-c
    pos(17px)

// --- CLose button ---
.Tab .close
  box(absolute)
  pos(4px, r: 4px)
  size(23px, same)
  cursor: pointer
  z-index: -1
  opacity: 0
  &:hover > svg
    fill: #ea4335
  &:active > svg
    transition: none
    fill: #fa5335
  > svg
    box(absolute)
    pos(3px, same)
    size(17px, same)
    fill: #a63626
    transition: fill var(--d-fast)

// --- Animations ---
@keyframes tab-loading
  0%
    opacity: 1
  100%
    opacity: 0
</style>
