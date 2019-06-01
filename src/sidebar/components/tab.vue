<template lang="pug">
.Tab(
  :data-active="tab.active"
  :data-status="tab.status"
  :data-progress="loading"
  :data-selected="selected"
  :data-favless="!favicon"
  :data-audible="tab.audible"
  :data-muted="tab.mutedInfo.muted"
  :data-discarded="tab.discarded"
  :data-updated="updated"
  :data-lvl="tab.lvl"
  :data-parent="tab.isParent"
  :data-folded="tab.folded"
  :data-invisible="tab.invisible"
  :data-close-btn="$store.state.showTabRmBtn"

  :style="{ transform: 'translateY(' + position + 'px)' }"
  :title="tooltip"
  @contextmenu.prevent.stop=""
  @mousedown="onMouseDown"
  @mouseup="onMouseUp"
  @mouseleave="onMouseLeave"
  @dblclick.prevent.stop="onDoubleClick"): .lvl-wrapper
  .complete-fx
  .drag-layer(
    draggable="true"
    @dragstart="onDragStart"
    @dragenter="onDragEnter"
    @dragleave="onDragLeave")
  .audio(@mousedown.stop="", @click="onAudioClick")
    svg.-loud: use(xlink:href="#icon_loud_badge")
    svg.-mute: use(xlink:href="#icon_mute_badge")
  .fav
    .placeholder: svg: use(:xlink:href="favPlaceholder")
    img(:src="favicon", @load.passive="onFaviconLoad")
    .exp(@dblclick.prevent.stop="", @mousedown.stop="onExp"): svg: use(xlink:href="#icon_expand")
    .update-badge
    .ok-badge
      svg: use(xlink:href="#icon_ok")
    .err-badge
      svg: use(xlink:href="#icon_err")
    .progress-spinner
    .child-count(v-if="childCount && tab.folded") {{childCount}}
  .close(v-if="$store.state.showTabRmBtn", @mousedown.stop="onCloseClick", @mouseup.stop="")
    svg: use(xlink:href="#icon_remove")
  .t-box
    .title {{tab.index}}::{{tab.id}} {{tab.title}}
    .loading
      svg.-a: use(xlink:href="#icon_load")
      svg.-b: use(xlink:href="#icon_load")
      svg.-c: use(xlink:href="#icon_load")
</template>


<script>
import EventBus from '../../event-bus'
import State from '../store/state'
import Actions from '../actions'

const PNG_RE = /(\.png)([?#].*)?$/i
const JPG_RE = /(\.jpe?g)([?#].*)?$/i
const PDF_RE = /(\.pdf)([?#].*)?$/i
const GROUP_RE = /\/group\/group\.html/

export default {
  props: {
    position: Number,
    childCount: Number,
    tab: {
      type: Object,
      default: () => ({}),
    },
  },

  data() {
    return {
      loading: false,
      selected: false,
    }
  },

  computed: {
    updated() {
      return !!State.updatedTabs[this.tab.id]
    },

    favicon() {
      if (this.tab.status === 'loading') return State.favicons[this.tab.host]
      else return this.tab.favIconUrl || State.favicons[this.tab.host]
    },

    tooltip() {
      try {
        return `${this.tab.title}\n${decodeURI(this.tab.url)}`
      } catch (err) {
        return `${this.tab.title}\n${this.tab.url}`
      }
    },

    favPlaceholder() {
      if (this.tab.url.startsWith('moz-extension:') && GROUP_RE.test(this.tab.url)) {
        return '#icon_group'
      }
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
    EventBus.$on('selectTab', this.onTabSelection)
    EventBus.$on('deselectTab', this.onTabDeselection)
    EventBus.$on('openTabMenu', this.onTabMenu)
  },

  beforeDestroy() {
    EventBus.$off('tabLoadingStart', this.loadingStart)
    EventBus.$off('tabLoadingEnd', this.loadingEnd)
    EventBus.$off('tabLoadingOk', this.loadingOk)
    EventBus.$off('tabLoadingErr', this.loadingErr)
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
      if (dc === 'reload') Actions.reloadTabs([this.tab.id])
      if (dc === 'duplicate') Actions.duplicateTabs([this.tab.id])
      if (dc === 'pin') Actions.repinTabs([this.tab.id])
      if (dc === 'mute') Actions.remuteTabs([this.tab.id])
      if (dc === 'clear_cookies') Actions.clearTabsCookies([this.tab.id])
      if (dc === 'exp' && this.tab.isParent) Actions.toggleBranch(this.tab.id)
      if (dc === 'new_after') Actions.createTabAfter(this.tab.id)
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
        // Activate tab (if nothing selected)
        if (!State.selected.length) {
          browser.tabs.update(this.tab.id, { active: true })
        }

        // Long-click action
        this.hodorL = setTimeout(() => {
          if (State.dragNodes) return
          let llc = State.tabLongLeftClick
          if (llc === 'reload') Actions.reloadTabs([this.tab.id])
          if (llc === 'duplicate') Actions.duplicateTabs([this.tab.id])
          if (llc === 'pin') Actions.repinTabs([this.tab.id])
          if (llc === 'mute') Actions.remuteTabs([this.tab.id])
          if (llc === 'clear_cookies') Actions.clearTabsCookies([this.tab.id])
          if (llc === 'new_after') Actions.createTabAfter(this.tab.id)
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
          if (lrc === 'reload') Actions.reloadTabs([this.tab.id])
          if (lrc === 'duplicate') Actions.duplicateTabs([this.tab.id])
          if (lrc === 'pin') Actions.repinTabs([this.tab.id])
          if (lrc === 'mute') Actions.remuteTabs([this.tab.id])
          if (lrc === 'clear_cookies') Actions.clearTabsCookies([this.tab.id])
          if (lrc === 'new_after') Actions.createTabAfter(this.tab.id)
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
        if (this.tab.isParent && this.tab.folded) {
        // Select whole branch if tab is folded
          Actions.resetSelection()
          const toSelect = [this.tab.id]
          for (let tab of State.tabs) {
            if (toSelect.includes(tab.parentId)) toSelect.push(tab.id)
          }
          toSelect.map(id => EventBus.$emit('selectTab', id))
          State.selected = [...toSelect]
          Actions.openCtxMenu(this.$el, this.tab)
        } else {
        // Select only current tab 
          Actions.closeCtxMenu()
          State.selected = [this.tab.id]
          this.selected = true
        }
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
      if (this.tab.invisible) return
      Actions.openCtxMenu(this.$el, this.tab)
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
      if (!this.hodorL) return

      // Hide context menu (if any)
      if (State.ctxMenu) State.ctxMenu = null

      // Check what to drag
      const toDrag = [this.tab.id]
      const tabsToDrag = []
      if (!State.selected.length) tabsToDrag.push(this.tab)
      for (let tab of State.tabs) {
        if (toDrag.includes(tab.parentId)) {
          toDrag.push(tab.id)
          tabsToDrag.push(tab)
          continue
        }
        if (State.selected.includes(tab.id)) {
          toDrag.push(tab.id)
          tabsToDrag.push(tab)
        }
      }

      // Clear selected elements
      State.selected = []

      // Set drag info
      e.dataTransfer.setData('text/x-moz-text-internal', this.tab.url)
      e.dataTransfer.setData('text/x-moz-url', this.tab.url + '\n' + this.tab.title)
      e.dataTransfer.setData('text/x-moz-url-data', this.tab.url)
      e.dataTransfer.setData('text/x-moz-url-desc', this.tab.title)
      e.dataTransfer.setData('text/uri-list', this.tab.url)
      e.dataTransfer.setData('text/plain', this.tab.url)
      e.dataTransfer.setData('text/html', `<a href="${this.tab.url}>${this.tab.title}</a>`)
      e.dataTransfer.effectAllowed = 'move'
      const dragData = tabsToDrag.map(t => {
        return {
          ...JSON.parse(JSON.stringify(t)),
          type: 'tab',
          ctx: t.cookieStoreId,
          windowId: State.windowId,
          panel: State.panelIndex,
          incognito: State.private,
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
      if (this.tab.invisible) return
      if (this.dragEnterTimeout) clearTimeout(this.dragEnterTimeout)
      this.dragEnterTimeout = setTimeout(() => {
        if (!State.dragNodes) return
        browser.tabs.update(this.tab.id, { active: true })
        this.dragEnterTimeout = null
      }, 500)
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
        Actions.setFavicon(hn, base64)
      }
    },

    /**
     * Handle mousedown event on expand button
     */
    onExp(e) {
      // Fold/Expand branch
      if (e.button === 0) Actions.toggleBranch(this.tab.id)

      // Select whole branch and show menu
      if (e.button === 2) {
        Actions.resetSelection()
        const toSelect = [this.tab.id]
        for (let tab of State.tabs) {
          if (toSelect.includes(tab.parentId)) toSelect.push(tab.id)
        }
        toSelect.map(id => EventBus.$emit('selectTab', id))
        State.selected = [...toSelect]
        Actions.openCtxMenu(this.$el, this.tab)
      }
    },

    /**
     * Handle click on close btn
     */
    onCloseClick(e) {
      if (e.button === 0) this.close()
      if (e.button === 1) this.close()
      if (e.button === 2) this.closeTree()
    },

    /**
     * Handle click on audio button
     */
    onAudioClick() {
      Actions.remuteTabs([this.tab.id])
    },

    /**
     * Close tab
     */
    close() {
      Actions.removeTabs([this.tab.id])
    },

    /**
     * Close tabs tree
     */
    closeTree() {
      const toRemove = [this.tab.id]
      for (let tab of State.tabs) {
        if (toRemove.includes(tab.parentId)) toRemove.push(tab.id)
      }
      Actions.removeTabs(toRemove)
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
