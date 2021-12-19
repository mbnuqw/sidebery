import EventBus from '../../event-bus'
import State from '../store/state'
import Actions from '../actions'
import Favicon from '../components/favicon'

const PNG_RE = /(\.png)([?#].*)?$/i
const JPG_RE = /(\.jpe?g)([?#].*)?$/i
const PDF_RE = /(\.pdf)([?#].*)?$/i
const GROUP_RE = /\/group\/group\.html/

export default {
  components: { Favicon },

  computed: {
    loading() {
      if (this.tab.loading) return this.tab.loading
      return this.tab.status === 'loading'
    },

    color() {
      let container = State.containers[this.tab.cookieStoreId]
      if (container) return container.color
      return false
    },

    tooltip() {
      try {
        return `${this.tab.title}\n${decodeURI(this.tab.url)}`
      } catch (err) {
        return `${this.tab.title}\n${this.tab.url}`
      }
    },

    favPlaceholder() {
      if (this.tab.warn) return '#icon_warn'
      if (this.tab.url.startsWith('moz-extension:')) {
        if (GROUP_RE.test(this.tab.url)) return '#icon_group'
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
      if (State.ctxMenu) State.ctxMenu = null
      if (e.button === 0) this.onMouseDownLeft(e)
      if (e.button === 1) this.onMouseDownMid(e)
      if (e.button === 2) this.onMouseDownRight(e)
    },

    /**
     * Mousedown Left
     */
    onMouseDownLeft(e) {
      this.mouseDownLeft = true

      if (e.ctrlKey) {
        if (State.selected.length && typeof State.selected[0] !== 'number') return
        if (!this.tab.sel) Actions.selectItem(this.tab.id)
        else Actions.deselectItem(this.tab.id)
        return
      }

      if (e.shiftKey) {
        if (State.shiftSelAct && !State.selected.length && State.activeTabId > -1) {
          Actions.selectItem(State.activeTabId)
        }
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
        if (State.nativeHighlight) Actions.updateHighlightedTabs()
        // e.preventDefault() ? - from pinned tab
        return
      }

      if (State.selected.length && !this.tab.sel) Actions.resetSelection()

      // Activate tab (if nothing selected)
      if (!State.selected.length && !State.activateOnMouseUp) {
        browser.tabs.update(this.tab.id, { active: true })
      }

      // Long-click action
      this.longClickActionLeft = setTimeout(this.onLongLeftClick, 300)
    },

    /**
     * Handle long left click
     */
    onLongLeftClick() {
      if (State.dragNodes) return
      let llc = State.tabLongLeftClick
      if (llc === 'reload') Actions.reloadTabs([this.tab.id])
      if (llc === 'duplicate') Actions.duplicateTabs([this.tab.id])
      if (llc === 'pin') Actions.repinTabs([this.tab.id])
      if (llc === 'mute') Actions.remuteTabs([this.tab.id])
      if (llc === 'clear_cookies') Actions.clearTabsCookies([this.tab.id])
      if (llc === 'new_after') Actions.createTabAfter(this.tab.id)
      if (llc === 'new_child' && !this.tab.pinned) Actions.createChildTab(this.tab.id)
      if (llc !== 'none') State.tabLongClickFired = true
      this.longClickActionLeft = null
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
    onMouseDownRight(e) {
      if (!State.ctxMenuNative && !this.tab.sel) {
        Actions.resetSelection()
        Actions.startMultiSelection({
          type: 'tab',
          clientY: e.clientY,
          ctrlKey: e.ctrlKey,
          id: this.tab.id,
        })
      }

      // Long-click action
      this.longClickActionRight = setTimeout(this.onLongRightClick, 300)
    },

    /**
     * Handle long right click
     */
    onLongRightClick() {
      Actions.stopMultiSelection()
      Actions.resetSelection()
      let lrc = State.tabLongRightClick
      if (lrc === 'reload') Actions.reloadTabs([this.tab.id])
      if (lrc === 'duplicate') Actions.duplicateTabs([this.tab.id])
      if (lrc === 'pin') Actions.repinTabs([this.tab.id])
      if (lrc === 'mute') Actions.remuteTabs([this.tab.id])
      if (lrc === 'clear_cookies') Actions.clearTabsCookies([this.tab.id])
      if (lrc === 'new_after') Actions.createTabAfter(this.tab.id)
      if (lrc === 'new_child' && !this.tab.pinned) Actions.createChildTab(this.tab.id)
      if (lrc !== 'none') State.tabLongClickFired = true
      this.longClickActionRight = null
    },

    /**
     * Handle mouseup event
     */
    onMouseUp(e) {
      if (State.tabLongClickFired) {
        this.mouseDownLeft = false
        return Actions.resetLongClickLock()
      }

      if (e.button === 0) {
        if ((State.selected.length || State.activateOnMouseUp) && !e.ctrlKey && !e.shiftKey) {
          if (this.mouseDownLeft) browser.tabs.update(this.tab.id, { active: true })
        }
        if (this.longClickActionLeft) {
          this.longClickActionLeft = clearTimeout(this.longClickActionLeft)
        }
        this.mouseDownLeft = false
      }

      if (e.button === 2) {
        if (this.longClickActionRight) {
          this.longClickActionRight = clearTimeout(this.longClickActionRight)
        }

        if (e.ctrlKey || e.shiftKey) return

        Actions.stopMultiSelection()
        if (State.ctxMenuBlockTimeout) return
        if (!State.selected.length && !State.ctxMenuNative) this.select()
        if (!State.ctxMenuNative) Actions.openCtxMenu('tab', e.clientX, e.clientY)
      }
    },

    /**
     * Handle context menu
     */
    onCtxMenu(e) {
      if (State.tabLongClickFired || !State.ctxMenuNative || e.ctrlKey || e.shiftKey) {
        State.tabLongClickFired = false
        e.stopPropagation()
        e.preventDefault()
        return
      }

      if (!e.ctrlKey && !e.shiftKey && !this.tab.sel) {
        Actions.resetSelection()
      }

      if (State.ctxMenuBlockTimeout) {
        e.stopPropagation()
        e.preventDefault()
        return
      }

      let nativeCtx = { context: 'tab', tabId: this.tab.id }
      browser.menus.overrideContext(nativeCtx)

      if (!State.selected.length) this.select()

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
      if (dc === 'exp' && this.tab.isParent) Actions.toggleBranch(this.tab.id)
      if (dc === 'new_after') Actions.createTabAfter(this.tab.id)
      if (dc === 'new_child' && !this.tab.pinned) Actions.createChildTab(this.tab.id)
      if (dc === 'close') Actions.removeTabs([this.tab.id])
    },

    /**
     * Handle mouseleave event
     */
    onMouseLeave() {
      if (this.longClickActionLeft) {
        this.longClickActionLeft = clearTimeout(this.longClickActionLeft)
      }
      if (this.longClickActionRight) {
        this.longClickActionRight = clearTimeout(this.longClickActionRight)
      }
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
        if (State.tabsTree && !this.tab.pinned && toDrag.includes(tab.parentId)) {
          toDrag.push(tab.id)
          tabsToDrag.push(tab)
          continue
        }
        if (State.selected.includes(tab.id)) {
          toDrag.push(tab.id)
          tabsToDrag.push(tab)
        }
      }

      State.dragXStart = e.clientX

      // Clear selected elements
      State.selected = []

      // Set drag info
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
    onDragEnter(e) {
      if (this.tab.invisible) return
      if (this.tab.pinned) {
        this.dropSlot = true
        this.$emit('dragenter', this.tab.index)
      }

      if (State.dndTabAct) this.dndActivate(e)
      if (State.dndExp === 'hover') this.dndExp(e)
    },

    /**
     * Activate tab on drag enter
     */
    dndActivate(e) {
      if (State.dndTabActMod !== 'none' && !e[State.dndTabActMod + 'Key']) return
      if (this.dragActTimeout) clearTimeout(this.dragActTimeout)
      this.dragActTimeout = setTimeout(() => {
        this.dragActTimeout = null
        if (!State.dragMode) return
        browser.tabs.update(this.tab.id, { active: true })
      }, State.dndTabActDelay)
    },

    /**
     * Expand tabs branch on drag enter
     */
    dndExp(e) {
      if (State.dndExpMod !== 'none' && !e[State.dndExpMod + 'Key']) return
      if (this.dragExpTimeout) clearTimeout(this.dragExpTimeout)
      this.dragExpTimeout = setTimeout(() => {
        this.dragExpTimeout = null
        if (!State.dragMode) return
        Actions.toggleBranch(this.tab.id)
        Actions.updatePanelBoundsDebounced(128)
      }, State.dndExpDelay)
    },

    /**
     * Handle dragleave event
     */
    onDragLeave() {
      if (this.tab.pinned) this.dropSlot = false
      if (this.dragActTimeout) {
        clearTimeout(this.dragActTimeout)
        this.dragActTimeout = null
      }
      if (!this.tab.pinned && this.dragExpTimeout) {
        clearTimeout(this.dragExpTimeout)
        this.dragExpTimeout = null
      }
    },

    /**
     * Handle click on audio button
     */
    onAudioClick() {
      Actions.remuteTabs([this.tab.id])
    },

    /**
     * Select this tab
     */
    select() {
      if (!this.tab.pinned && this.tab.isParent && this.tab.folded) {
        // Select whole branch if tab is folded
        Actions.resetSelection()
        this.tab.sel = true
        State.selected.push(this.tab.id)
        for (let tab, i = this.tab.index + 1; i < State.tabs.length; i++) {
          tab = State.tabs[i]
          if (tab.lvl <= this.tab.lvl) break

          tab.sel = true
          State.selected.push(tab.id)
        }
      } else {
        // Select only current tab
        Actions.selectItem(this.tab.id)
      }
    },

    /**
     * Close tab
     */
    close() {
      Actions.removeTabs([this.tab.id])
    },
  },
}
