<template lang="pug">
.PinnedTab(:is-active="tab.active"
  :data-no-fav="!favicon || faviErr"
  :data-audible="tab.audible"
  :data-muted="tab.mutedInfo.muted"
  :is-selected="selected"
  :discarded="tab.discarded"
  :updated="updated"
  :loading="loading || tab.status === 'loading'"
  :drop-slot="dropSlot"
  :title="tooltip"
  @contextmenu.prevent.stop=""
  @mousedown="onMouseDown"
  @mouseup="onMouseUp"
  @mouseleave="onMouseLeave"
  @dblclick.prevent.stop="onDoubleClick")
  .loaded-fx
  .drag-layer(draggable="true"
    @dragstart="onDragStart"
    @dragenter="onDragEnter"
    @dragleave="onDragLeave"
    @drop="onDragLeave")
  .fav
    .placeholder: svg: use(:xlink:href="fav_placeholder")
    img(:src="favicon", @load.passive="onFaviconLoad", @error="onFaviconErr")
    .update-badge
    .ok-badge
      svg: use(xlink:href="#icon_ok")
    .err-badge
      svg: use(xlink:href="#icon_err")
    .loading-spinner
      each n in [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]
        .spinner-stick(class='spinner-stick-' + n)
    .audio-badge(@mousedown.stop="", @click="$store.dispatch('remuteTabs', [tab.id])")
      svg.-loud: use(xlink:href="#icon_loud")
      svg.-mute: use(xlink:href="#icon_mute")
  .ctx(v-if="ctx && ctxColor", :style="{background: ctxColor}")
  .title(v-if="withTitle") {{tab.title}}
</template>


<script>
import { mapGetters } from 'vuex'
import Store from '../../store'
import State from '../../store.state'
import EventBus from '../../event-bus'

const PNG_RE = /(\.png)([?#].*)?$/i
const JPG_RE = /(\.jpe?g)([?#].*)?$/i
const PDF_RE = /(\.pdf)([?#].*)?$/i

export default {
  props: {
    tab: {
      type: Object,
      default: () => ({}),
    },
    ctx: Boolean,
  },

  data() {
    return {
      menu: false,
      faviErr: false,
      loading: false,
      selected: false,
      dropSlot: false,
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

    ctxColor() {
      const ctx = State.ctxs.find(c => c.cookieStoreId === this.tab.cookieStoreId)
      if (ctx && ctx.colorCode) return ctx.colorCode
      else return ''
    },

    tooltip() {
      return `${this.tab.title}\n${this.tab.url}`
    },

    withTitle() {
      return State.pinnedTabsPosition === 'panel' && State.pinnedTabsList
    },

    fav_placeholder() {
      if (PNG_RE.test(this.tab.url)) return '#icon_png'
      if (JPG_RE.test(this.tab.url)) return '#icon_jpg'
      if (PDF_RE.test(this.tab.url)) return '#icon_pdf'
      if (this.tab.url.startsWith('file:')) return '#icon_local_file'
      return '#icon_ff'
    },
  },

  created() {
    EventBus.$on('tabLoadingStart', this.loadingStart)
    EventBus.$on('tabLoadingEnd', this.loadingEnd)
    EventBus.$on('tabLoadingOk', this.loadingOk)
    EventBus.$on('tabLoadingErr', this.loadingErr)
    EventBus.$on('tabLoaded', this.onLoaded)
    EventBus.$on('selectTab', this.onTabSelection)
    EventBus.$on('deselectTab', this.onTabDeselection)
    EventBus.$on('openTabMenu', this.onTabMenu)
  },

  beforeDestroy() {
    EventBus.$off('tabLoadingStart', this.loadingStart)
    EventBus.$off('tabLoadingEnd', this.loadingEnd)
    EventBus.$off('tabLoadingOk', this.loadingOk)
    EventBus.$off('tabLoadingErr', this.loadingErr)
    EventBus.$off('tabLoaded', this.onLoaded)
    EventBus.$off('selectTab', this.onTabSelection)
    EventBus.$off('deselectTab', this.onTabDeselection)
    EventBus.$off('openTabMenu', this.onTabMenu)
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
        if (this.tab.folded) this.closeTree()
        else this.close()
        e.preventDefault()
        e.stopPropagation()
      }

      if (e.button === 0) {
        // Activate tab
        browser.tabs.update(this.tab.id, { active: true })

        // Long-click action
        this.hodorL = setTimeout(() => {
          let llc = State.tabLongLeftClick
          if (llc === 'reload') Store.dispatch('reloadTabs', [this.tab.id])
          if (llc === 'duplicate') Store.dispatch('duplicateTabs', [this.tab.id])
          if (llc === 'pin') Store.dispatch('repinTabs', [this.tab.id])
          if (llc === 'mute') Store.dispatch('remuteTabs', [this.tab.id])
          if (llc === 'clear_cookies') Store.dispatch('clearTabsCookies', [this.tab.id])
          this.hodorL = null
        }, 250)
      }

      if (e.button === 2) {
        e.preventDefault()
        e.stopPropagation()
        this.$emit('start-selection', {
          type: 'tab',
          clientY: e.clientY,
          ctrlKey: e.ctrlKey,
          id: this.tab.id,
        })
        // Long-click action
        this.hodorR = setTimeout(() => {
          this.$emit('stop-selection')
          let lrc = State.tabLongRightClick
          if (lrc === 'reload') Store.dispatch('reloadTabs', [this.tab.id])
          if (lrc === 'duplicate') Store.dispatch('duplicateTabs', [this.tab.id])
          if (lrc === 'pin') Store.dispatch('repinTabs', [this.tab.id])
          if (lrc === 'mute') Store.dispatch('remuteTabs', [this.tab.id])
          if (lrc === 'clear_cookies') Store.dispatch('clearTabsCookies', [this.tab.id])
          this.hodorR = null
        }, 250)
      }
    },

    /**
     * Handle mouseup event
     */
    onMouseUp(e) {
      if (e.button === 0 && this.hodorL) {
        this.hodorL = clearTimeout(this.hodorL)
      }
      if (e.button === 2 && this.hodorR) {
        this.hodorR = clearTimeout(this.hodorR)

        // Select this tab
        Store.commit('closeCtxMenu')
        State.selected = [this.tab.id]
        this.selected = true
      }
    },

    /**
     * Handle tab-selection event
     */
    onTabSelection(id) {
      if (this.tab.id === id) {
        this.selected = true
        this.hodorR = clearTimeout(this.hodorR)
      }
    },
  
    /**
     * Handle tab-deselection event
     */
    onTabDeselection(id) {
      if (!id) this.selected = false
      if (id && this.tab.id === id) this.selected = false
    },

    /**
     * Open tab[s] menu
     */
    onTabMenu(id) {
      if (id !== this.tab.id) return
      Store.dispatch('openCtxMenu', { el: this.$el, node: this.tab })
    },

    /**
     * Handle mouseleave event
     */
    onMouseLeave() {
      if (this.hodorL) this.hodorL = clearTimeout(this.hodorL)
      if (this.hodorR) this.hodorR = clearTimeout(this.hodorR)
    },

    /**
     * Handle dragstart event.
     */
    onDragStart(e) {
      // console.log('[DEBUG] PinnedTab onDragStart');
      // Check what to drag
      const toDrag = [this.tab.id]
      const tabsToDrag = [this.tab]
      for (let tab of State.tabs) {
        if (toDrag.includes(tab.parentId)) {
          toDrag.push(tab.id)
          tabsToDrag.push(tab)
        }
      }

      // Set drag info
      e.dataTransfer.setData('text/x-moz-text-internal', this.tab.url)
      e.dataTransfer.setData('text/uri-list', this.tab.url)
      e.dataTransfer.setData('text/plain', this.tab.url)
      e.dataTransfer.effectAllowed = 'move'
      const dragData = tabsToDrag.map(t => {
        return {
          type: 'tab',
          id: t.id,
          parentId: t.parentId,
          index: t.index,
          pinned: true,
          lvl: 0,
          ctx: t.cookieStoreId,
          incognito: State.private,
          windowId: State.windowId,
          panel: State.panelIndex,
          url: t.url,
          title: t.title,
        }
      })
      EventBus.$emit('dragStart', dragData)
      Store.dispatch('broadcast', {
        name: 'outerDragStart',
        arg: dragData,
      })
    },

    /**
     * Handle dragenter event
     */
    onDragEnter() {
      this.$emit('dragenter', this.tab.index)
      this.dropSlot = true

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
      this.dropSlot = false

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

    /**
     * Handle mousedown event on expand button
     */
    onExp(e) {
      // Fold/Expand branch
      if (e.button === 0) Store.dispatch('toggleBranch', this.tab.id)

      // Select whole branch and show menu
      if (e.button === 2) {
        const toSelect = [this.tab.id]
        for (let tab of State.tabs) {
          if (toSelect.includes(tab.parentId)) toSelect.push(tab.id)
        }
        toSelect.map(id => EventBus.$emit('selectTab', id))
        State.selected = [...toSelect]
        Store.dispatch('openCtxMenu', { el: this.$el, node: this.tab })
      }
    },

    /**
     * Handle click on close btn
     */
    onCloseClick(e) {
      if (e.button === 0) this.close()
      if (e.button === 2) this.closeTree()
    },

    onLoaded(id) {
      if (id !== this.tab.id) return
      if (this.tab.status !== 'loading') return
      this.$el.classList.remove('-loaded')
      this.$el.offsetHeight
      this.$el.classList.add('-loaded')
      setTimeout(() => {this.$el.classList.remove('-loaded')}, 500)
    },

    /**
     * Close tab
     */
    close() {
      Store.dispatch('removeTab', this.tab)
    },

    /**
     * Close tabs tree
     */
    closeTree() {
      const toRemove = [this.tab.id]
      for (let tab of State.tabs) {
        if (toRemove.includes(tab.parentId)) toRemove.push(tab.id)
      }
      if (toRemove.length === 1) Store.dispatch('removeTab', this.tab)
      else if (toRemove.length > 1) Store.dispatch('removeTabs', toRemove)
    },

    loadingStart(id) {
      if (id !== this.tab.id) return
      this.loading = true
      if (this.loadingTimer) {
        clearTimeout(this.loadingTimer)
        this.loadingTimer = null
      }
    },

    loadingEnd(id) {
      if (id !== this.tab.id) return
      this.loading = false
    },

    loadingOk(id) {
      if (id !== this.tab.id) return
      this.loading = 'ok'
      this.loadingTimer = setTimeout(() => {
        this.loadingEnd(id)
        this.loadingTimer = null
      }, 2000)
    },

    loadingErr(id) {
      if (id !== this.tab.id) return
      this.loading = 'err'
      this.loadingTimer = setTimeout(() => {
        this.loadingEnd(id)
        this.loadingTimer = null
      }, 2000)
    },

    // ??? remove
    height() {
      return this.$el.offsetHeight
    },
  },
}
</script>


<style lang="stylus">
@import '../../../styles/mixins'


.PinnedTab
  --pinned-tab-size: 32px

  box(relative, flex)
  size(32px, same)
  width: var(--pinned-tab-size)
  overflow: hidden
  justify-content: center
  align-items: center
  transform: translateZ(0)
  transition: opacity var(--d-fast), transform .12s, z-index 0s .2s
  &:hover
    background-color: var(--tabs-bg-hover)
  &:hover
  &[is-active]:hover
    .fav
      opacity: .7
    .title
      color: var(--tabs-fg-hover)
  &:active
  &[is-active]:active
    background-color: var(--tabs-bg-active)
    .fav
      transition: none
      opacity: .5

  &:before
    content: ''
    box(absolute)
    size(100%, same)
    pos(1px, 1px)
    opacity: 0
    transition: opacity var(--d-fast)

  &[is-active]
    background-color: var(--tabs-activated-bg)
    .fav
      opacity: 1
    .title
      color: var(--tabs-activated-fg)

  &[close-btn]:hover
    &[data-audible] .t-box
    &[data-muted] .t-box
      mask: linear-gradient(-90deg, transparent, transparent 42px, #000000 64px, #000000)
    .t-box
      mask: linear-gradient(-90deg, transparent, transparent 24px, #000000 48px, #000000)

  &[data-no-fav]
    .fav > .placeholder
      opacity: 1
      transform: translateY(0)
    .fav > img
      opacity: 0
      transform: translateY(-4px)

  &[is-selected]
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
        #00000032 4px,
        #000000 5px,
        #000000
      )
    > .update-badge
      opacity: 1
      transform: scale(1, 1)

#root.-pinned-tabs-panel.-pinned-tabs-list
  .PinnedTab
    size(100%)
    justify-content: flex-start
    height: var(--tabs-height)
    padding-left: 1px
  .PinnedTab:before
    box-shadow: 0 -1px 0 0 var(--tabs-update-badge-bg)

#root.-pinned-tabs-panel
#root.-pinned-tabs-top
  .PinnedTab:before
    box-shadow: -1px 0 0 0 var(--tabs-update-badge-bg)

#root.-pinned-tabs-left
#root.-pinned-tabs-right
  .PinnedTab:before
    box-shadow: 0 -1px 0 0 var(--tabs-update-badge-bg)

// --- Level Wrapper
.PinnedTab .lvl-wrapper
  box(relative, flex)
  size(100%, same)
  align-items: center

// --- Drag layer ---
.PinnedTab .drag-layer
  box(absolute)
  size(100%, same)
  pos(0, 0)
  z-index: 25

// --- Audio ---
.PinnedTab .audio
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
.PinnedTab .fav
  box(relative)
  size(16px, same)
  margin: 0 6px
  flex-shrink: 0
  opacity: 1
  z-index: 20
  transition: opacity var(--d-fast), transform var(--d-fast)

// --- Placeholer
.PinnedTab .fav > .placeholder
  box(absolute)
  size(16px, same)
  pos(0, 0)
  opacity: 0
  transform: translateY(4px)
  transition: opacity var(--d-fast), transform var(--d-fast)
  > svg
    box(absolute)
    size(100%, same)
    pos(0, 0)
    fill: var(--favicons-placehoder-bg)

// --- Favicon image
.PinnedTab .fav > img
  box(absolute)
  size(100%, same)
  transition: opacity var(--d-fast), transform var(--d-fast)

// --- Loading
.PinnedTab .fav > .loading-spinner
  box(absolute)
  size(10px, same)
  pos(b: -4px, r: -4px)
  border-radius: 50%
  opacity: 0
  transition: opacity var(--d-norm)

  > .spinner-stick
    box(absolute)
    size(1px, 4px)
    pos(calc(50% - 2px), calc(50% - 1px))
    opacity: 0

    &:before
      box(absolute)
      pos(4px, 0)
      size(100%, same)
      background-color: var(--tabs-loading-fg)
      content: ''
  for i in 0..12
    > .spinner-stick-{i}
      transform: rotateZ((i * 30)deg)
      animation: none

.PinnedTab[loading="true"]:not([data-audible]):not([data-muted]) .fav
    cursor: progress
    > .loading-spinner
      opacity: 1
      for i in 0..12
        > .spinner-stick-{i}
          animation: loading-spin .6s (i*50)ms infinite
.PinnedTab[loading="ok"] .fav > .ok-badge
  opacity: 1
  transform: scale(1, 1)
.PinnedTab[loading="err"] .fav > .err-badge
  opacity: 1
  transform: scale(1, 1)
.PinnedTab[loading] .fav > img
  mask: radial-gradient(
    circle at calc(100% - 1px) calc(100% - 1px),
    #00000032,
    #00000032 7px,
    #000000 8px,
    #000000
  )

// --- Updated (highlight)
.PinnedTab .fav > .update-badge
  box(absolute)
  size(6px, same)
  pos(b: -1px, r: -1px)
  border-radius: 50%
  background-color: var(--tabs-update-badge-bg)
  opacity: 0
  transform: scale(0.7, 0.7)
  transition: opacity var(--d-norm), transform var(--d-norm)

// --- Ok / Error badges
.PinnedTab .fav > .ok-badge
.PinnedTab .fav > .err-badge
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

.PinnedTab .fav > .ok-badge > svg
  fill: var(--true-fg)

.PinnedTab .fav > .err-badge > svg
  fill: var(--false-fg)

// --- Audio badge
.PinnedTab .fav > .audio-badge
  box(absolute)
  size(10px, same)
  pos(b: -3px, r: -3px)
  border-radius: 50%
  opacity: 0
  z-index: -1
  transform: scale(0.7, 0.7)
  transition: opacity var(--d-norm), transform var(--d-norm), z-index var(--d-norm)
  > svg
    box(absolute)
    size(100%, same)
    fill: var(--label-fg)
    opacity: 0
    transition: opacity var(--d-norm)

.PinnedTab[data-audible]
.PinnedTab[data-muted]
  .fav > img
    mask: radial-gradient(
      circle at calc(100% - 2px) calc(100% - 2px),
      #00000032,
      #00000032 6.5px,
      #000000 7.5px,
      #000000
    )
  .fav > .audio-badge
    z-index: 2
    opacity: 1
    transform: scale(1, 1)

.PinnedTab[data-audible]
  .fav > .audio-badge > svg.-loud
    opacity: 1

.PinnedTab[data-muted]
  .fav > .audio-badge > svg.-mute
    opacity: 1

// --- Loaded fx
.PinnedTab .loaded-fx
  box(absolute)
  size(100%, same)
  pos(0, 0)
  background-image: linear-gradient(90deg, #00000000, var(--tabs-loading-fg))
  opacity: 0
  transform: translateX(-100%)
.PinnedTab.-loaded .loaded-fx
  animation: tab-loaded .2s

// --- Context highlight
.PinnedTab .ctx
  box(absolute)
  pos(3px, 3px)
  size(7px, 7px)
  border-radius: 50%
  z-index: 2000
  box-shadow: inset 0 0 1px 0 var(--title-fg)

// --- Drop slot
.PinnedTab[drop-slot]
  &:before
    opacity: 1

// --- Title
.PinnedTab .title
  box(relative)
  flex-grow: 1
  font: var(--tabs-font)
  color: var(--tabs-fg)
  padding: 0 1px
  transition: color .2s
  white-space: nowrap
  overflow: hidden
  transition: transform var(--d-fast), color var(--d-fast), mask var(--d-fast)
  mask: linear-gradient(-90deg, transparent, #000000 12px, #000000)
</style>
