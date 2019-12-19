<template lang="pug">
.PinnedTab(
  :data-active="tab.active"
  :data-loading="loading"
  :data-selected="tab.sel"
  :data-audible="tab.audible"
  :data-muted="tab.mutedInfo.muted"
  :data-discarded="tab.discarded"
  :data-updated="tab.updated"
  :data-drop-slot="dropSlot"
  :data-close-btn="$store.state.showTabRmBtn"
  :data-color="color"

  :title="tooltip"
  @contextmenu.stop="onCtxMenu"
  @mousedown.stop="onMouseDown"
  @mouseup.stop="onMouseUp"
  @mouseleave="onMouseLeave"
  @dblclick.prevent.stop="onDoubleClick")
  transition(name="tab-complete"): .complete-fx(v-if="tab.status === 'loading'")
  .drag-layer(draggable="true"
    @dragstart="onDragStart"
    @dragenter="onDragEnter"
    @dragleave="onDragLeave"
    @drop="onDragLeave")
  .fav
    transition(name="tab-part"): .placeholder(v-if="!tab.favIconUrl"): svg: use(:xlink:href="favPlaceholder")
    transition(name="tab-part"): img(v-if="tab.favIconUrl" :src="tab.favIconUrl")
    .update-badge
    transition(name="tab-part"): .ok-badge(v-if="loading === 'ok'"): svg: use(xlink:href="#icon_ok")
    transition(name="tab-part"): .err-badge(v-if="loading === 'err'"): svg: use(xlink:href="#icon_err")
    transition(name="tab-part"): .progress-spinner(v-if="loading === true")
  transition(name="tab-part"): .audio-badge(v-if="tab.audible || tab.mutedInfo.muted" @mousedown.stop="" @click="onAudioClick")
    svg.-loud: use(xlink:href="#icon_loud_badge")
    svg.-mute: use(xlink:href="#icon_mute_badge")
  .ctx(v-if="color")
  .title(v-if="withTitle") {{tab.title}}
  .close(v-if="$store.state.showTabRmBtn" @mousedown.stop="close" @mouseup.stop="")
    svg: use(xlink:href="#icon_remove")
</template>

<script>
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
      dropSlot: false,
    }
  },

  computed: {
    loading() {
      if (this.tab.loading) return this.tab.loading
      return this.tab.status === 'loading'
    },

    color() {
      let ctr = State.containers[this.tab.cookieStoreId]
      if (ctr && ctr.color) return ctr.color
      else return ''
    },

    tooltip() {
      return `${this.tab.title}\n${this.tab.url}`
    },

    withTitle() {
      return State.pinnedTabsPosition === 'panel' && State.pinnedTabsList
    },

    favPlaceholder() {
      if (this.tab.warn) return '#icon_warn'
      if (this.tab.url.startsWith('moz-extension:')) {
        if (this.tab.url.indexOf('/settings/settings.html', 38) !== -1) {
          return '#icon_settings'
        }
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

  methods: {
    /**
     * Mousedown handler
     */
    onMouseDown(e) {
      Actions.closeCtxMenu()
      if (e.button === 0) this.onMouseDownLeft(e)
      if (e.button === 1) this.onMouseDownMid(e)
      if (e.button === 2) this.onMouseDownRight(e)
    },

    /**
     * Mousedown Left
     */
    onMouseDownLeft(e) {
      if (e.ctrlKey) {
        if (State.selected.length && typeof State.selected[0] !== 'number') {
          return
        }
        if (!this.tab.sel) Actions.selectItem(this.tab.id)
        else Actions.deselectItem(this.tab.id)
        return
      }

      if (e.shiftKey) {
        if (!State.selected.length) {
          Actions.selectItem(this.tab.id)
        } else {
          let first = State.tabsMap[State.selected[0]]
          for (let id of State.selected) {
            State.tabsMap[id].sel = false
          }
          State.selected = [first.id]
          let minIndex = Math.min(first.index, this.tab.index)
          let maxIndex = Math.max(first.index, this.tab.index)

          for (let i = minIndex; i <= maxIndex; i++) {
            if (State.tabs[i].invisible) continue
            State.tabs[i].sel = true
            if (i !== first.index) State.selected.push(State.tabs[i].id)
          }
        }
        e.preventDefault()
        return
      }

      if (State.selected.length && !this.tab.sel) {
        Actions.resetSelection()
      }

      // Activate tab (if nothing selected)
      if (!State.selected.length && !State.activateOnMouseUp) {
        browser.tabs.update(this.tab.id, { active: true })
      }

      // Long-click action
      this.longClickActionLeftFired = false
      this.longClickActionLeft = setTimeout(() => {
        if (State.dragNodes) return
        let llc = State.tabLongLeftClick
        if (llc === 'reload') Actions.reloadTabs([this.tab.id])
        if (llc === 'duplicate') Actions.duplicateTabs([this.tab.id])
        if (llc === 'pin') Actions.repinTabs([this.tab.id])
        if (llc === 'mute') Actions.remuteTabs([this.tab.id])
        if (llc === 'clear_cookies') Actions.clearTabsCookies([this.tab.id])
        if (llc === 'new_after') Actions.createTabAfter(this.tab.id)
        if (llc !== 'none') this.longClickActionLeftFired = true
        this.longClickActionLeft = null
      }, 300)
    },

    /**
     * Mousedown Mid
     */
    onMouseDownMid(e) {
      this.close()
      Actions.blockWheel()
      e.preventDefault()
    },

    /**
     * Mousedown Right
     */
    onMouseDownRight() {
      if (!State.ctxMenuNative && !this.tab.sel) {
        Actions.resetSelection()
      }

      // Long-click action
      this.longClickActionRightFired = false
      this.longClickActionRight = setTimeout(() => {
        Actions.stopMultiSelection()
        let lrc = State.tabLongRightClick
        if (lrc === 'reload') Actions.reloadTabs([this.tab.id])
        if (lrc === 'duplicate') Actions.duplicateTabs([this.tab.id])
        if (lrc === 'pin') Actions.repinTabs([this.tab.id])
        if (lrc === 'mute') Actions.remuteTabs([this.tab.id])
        if (lrc === 'clear_cookies') Actions.clearTabsCookies([this.tab.id])
        if (lrc === 'new_after') Actions.createTabAfter(this.tab.id)
        if (lrc !== 'none') this.longClickActionRightFired = true
        this.longClickActionRight = null
      }, 300)
    },

    /**
     * Handle mouseup event
     */
    onMouseUp(e) {
      if (e.button === 0) {
        if (
          (State.selected.length || State.activateOnMouseUp) &&
          !this.longClickActionLeftFired &&
          !e.ctrlKey &&
          !e.shiftKey
        ) {
          browser.tabs.update(this.tab.id, { active: true })
        }
        if (this.longClickActionLeft) {
          this.longClickActionLeft = clearTimeout(this.longClickActionLeft)
        }
      }

      if (e.button === 2) {
        if (this.longClickActionRight) {
          this.longClickActionRight = clearTimeout(this.longClickActionRight)
        }

        if (e.ctrlKey || e.shiftKey) return

        Actions.stopMultiSelection()
        if (!State.ctxMenuNative && !this.longClickActionRightFired) {
          Actions.selectItem(this.tab.id)
        }
        if (!State.ctxMenuNative) Actions.openCtxMenu('tab', e.clientX, e.clientY)
      }
    },

    /**
     * Handle context menu
     */
    onCtxMenu(e) {
      if (this.longClickActionRightFired || !State.ctxMenuNative || e.ctrlKey || e.shiftKey) {
        e.stopPropagation()
        e.preventDefault()
        return
      }

      if (!e.ctrlKey && !e.shiftKey && !this.tab.sel) {
        Actions.resetSelection()
      }

      let nativeCtx = { context: 'tab', tabId: this.tab.id }
      browser.menus.overrideContext(nativeCtx)

      if (!State.selected.length) Actions.selectItem(this.tab.id)

      Actions.openCtxMenu('tab')
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
      if (dc === 'close') Actions.removeTabs([this.tab.id])
    },

    /**
     * Handle mouseleave event
     */
    onMouseLeave() {
      if (this.longClickActionLeft)
        this.longClickActionLeft = clearTimeout(this.longClickActionLeft)
      if (this.longClickActionRight)
        this.longClickActionRight = clearTimeout(this.longClickActionRight)
    },

    /**
     * Handle dragstart event.
     */
    onDragStart(e) {
      if (!this.longClickActionLeft) return

      // Hide context menu (if any)
      if (State.ctxMenu) State.ctxMenu = null

      // Check what to drag
      const toDrag = [this.tab.id]
      const tabsToDrag = []
      if (!State.selected.length) tabsToDrag.push(this.tab)
      for (let tab of State.tabs) {
        if (State.selected.includes(tab.id)) {
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
          ...Utils.cloneObject(t),
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
     * Handle click on audio button
     */
    onAudioClick() {
      Actions.remuteTabs([this.tab.id])
    },

    /**
     * Close tab
     */
    close() {
      browser.tabs.remove(this.tab.id)
    },
  },
}
</script>
