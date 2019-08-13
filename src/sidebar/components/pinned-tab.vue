<template lang="pug">
.PinnedTab(
  :data-active="tab.active"
  :data-status="tab.status"
  :data-progress="loading"
  :data-selected="tab.sel"
  :data-favless="!favicon"
  :data-audible="tab.audible"
  :data-muted="tab.mutedInfo.muted"
  :data-discarded="tab.discarded"
  :data-updated="tab.updated"
  :data-drop-slot="dropSlot"
  :data-close-btn="$store.state.showTabRmBtn"
  :data-color="color"

  :title="tooltip"
  @contextmenu="onCtxMenu"
  @mousedown="onMouseDown"
  @mouseup="onMouseUp"
  @mouseleave="onMouseLeave"
  @dblclick.prevent.stop="onDoubleClick")
  .complete-fx
  .drag-layer(draggable="true"
    @dragstart="onDragStart"
    @dragenter="onDragEnter"
    @dragleave="onDragLeave"
    @drop="onDragLeave")
  .fav
    .placeholder: svg: use(:xlink:href="favPlaceholder")
    img(:src="favicon" @load.passive="onFaviconLoad")
    .update-badge
    .ok-badge
      svg: use(xlink:href="#icon_ok")
    .err-badge
      svg: use(xlink:href="#icon_err")
    .progress-spinner
    .audio-badge
      svg.-loud: use(xlink:href="#icon_loud_badge")
      svg.-mute: use(xlink:href="#icon_mute_badge")
  .ctx(v-if="ctx && color" :style="{background: color}")
  .title(v-if="withTitle") {{tab.title}}
  .close(v-if="$store.state.showTabRmBtn" @mousedown.stop="close" @mouseup.stop="")
    svg: use(xlink:href="#icon_remove")
</template>

<script>
import { mapGetters } from 'vuex'
import EventBus from '../../event-bus'
import State from '../store/state'
import Actions from '../actions'

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
      dropSlot: false,
    }
  },

  computed: {
    ...mapGetters(['showTabRmBtn']),

    favicon() {
      if (this.tab.status === 'loading') return State.favicons[State.favUrls[this.tab.url]]
      else return this.tab.favIconUrl || State.favicons[State.favUrls[this.tab.url]]
    },

    color() {
      const panel = State.panelsMap[this.tab.cookieStoreId]
      if (panel && panel.color) return panel.color
      else return ''
    },

    tooltip() {
      return `${this.tab.title}\n${this.tab.url}`
    },

    withTitle() {
      return State.pinnedTabsPosition === 'panel' && State.pinnedTabsList
    },

    favPlaceholder() {
      if (PNG_RE.test(this.tab.url)) return '#icon_png'
      if (JPG_RE.test(this.tab.url)) return '#icon_jpg'
      if (PDF_RE.test(this.tab.url)) return '#icon_pdf'
      if (this.tab.url.startsWith('file:')) return '#icon_local_file'
      if (this.tab.url.startsWith('about:preferences')) return '#icon_pref'
      if (this.tab.url.startsWith('about:addons')) return '#icon_addons'
      if (this.tab.url.startsWith('about:performance')) return '#icon_perf'
      return '#icon_ff'
    },
  },

  created() {
    EventBus.$on('tabLoadingStart', this.loadingStart)
    EventBus.$on('tabLoadingEnd', this.loadingEnd)
    EventBus.$on('tabLoadingOk', this.loadingOk)
    EventBus.$on('tabLoadingErr', this.loadingErr)
  },

  beforeDestroy() {
    EventBus.$off('tabLoadingStart', this.loadingStart)
    EventBus.$off('tabLoadingEnd', this.loadingEnd)
    EventBus.$off('tabLoadingOk', this.loadingOk)
    EventBus.$off('tabLoadingErr', this.loadingErr)
  },

  methods: {
    /**
     * Handle context menu
     */
    onCtxMenu(e) {
      if (!State.ctxMenuNative) {
        e.stopPropagation()
        e.preventDefault()
        return
      }

      State.menuCtx = { type: 'tab', el: this.$el, item: this.tab }
    },

    /**
     * Double click handler
     */
    onDoubleClick() {
      let dc = State.tabDoubleClick
      if (dc === 'reload') Actions.reloadTabs([this.tab.id])
      if (dc === 'duplicate') Actions.duplicateTabs([this.tab.id])
      if (dc === 'pin') Actions.repinTabs([this.tab.id])
      if (dc === 'mute') Actions.remuteTabs([this.tab.id])
      if (dc === 'clear_cookies') Actions.clearTabsCookies([this.tab.id])
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
        if (e.ctrlKey) {
          if (!this.tab.sel) Actions.selectItem(this.tab.id)
          else Actions.deselectItem(this.tab.id)
          return
        }

        // Activate tab
        if (!State.selected.length) {
          browser.tabs.update(this.tab.id, { active: true })
        }

        // Long-click action
        this.hodorL = setTimeout(() => {
          let llc = State.tabLongLeftClick
          if (llc === 'reload') Actions.reloadTabs([this.tab.id])
          if (llc === 'duplicate') Actions.duplicateTabs([this.tab.id])
          if (llc === 'pin') Actions.repinTabs([this.tab.id])
          if (llc === 'mute') Actions.remuteTabs([this.tab.id])
          if (llc === 'clear_cookies') Actions.clearTabsCookies([this.tab.id])
          this.hodorL = null
        }, 250)
      }

      if (e.button === 2) {
        e.preventDefault()
        e.stopPropagation()
        // Long-click action
        this.hodorR = setTimeout(() => {
          this.$emit('stop-selection')
          let lrc = State.tabLongRightClick
          if (lrc === 'reload') Actions.reloadTabs([this.tab.id])
          if (lrc === 'duplicate') Actions.duplicateTabs([this.tab.id])
          if (lrc === 'pin') Actions.repinTabs([this.tab.id])
          if (lrc === 'mute') Actions.remuteTabs([this.tab.id])
          if (lrc === 'clear_cookies') Actions.clearTabsCookies([this.tab.id])
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

        if (e.ctrlKey) return

        // Select this tab
        Actions.closeCtxMenu()
        Actions.selectItem(this.tab.id)
      }
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
      browser.runtime.sendMessage({
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
        // let hn = this.tab.url.split('/')[2]
        // if (!hn) return
        Actions.setFavicon(this.tab.url, base64)
      }
    },

    onFaviconErr() {
      this.faviErr = true
    },

    /**
     * Close tab
     */
    close() {
      this.$emit('remove', this.tab)
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
