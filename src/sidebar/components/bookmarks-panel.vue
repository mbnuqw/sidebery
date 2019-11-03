<template lang="pug">
.Bookmarks(
  :data-unrenderable="!renderable"
  :data-invisible="!visible" @click="onClick"
  @contextmenu.stop="onNavCtxMenu"
  @mouseup.right="onRightMouseUp")
  ScrollBox(ref="scrollBox"): .bookmarks-wrapper
    component.node(
      v-for="n in $store.state.bookmarks"
      :is="n.type"
      :key="n.id"
      :node="n"
      @start-selection="onStartSelection")
  transition(name="editor")
    BookmarkEditor.editor(v-if="$store.state.bookmarkEditor")
  SelectBookmarksFolderBar
</template>


<script>
import Utils from '../../utils'
import EventBus from '../../event-bus'
import State from '../store/state'
import Actions from '../actions'
import ScrollBox from './scroll-box'
import Bookmark from './bookmark'
import Folder from './bookmarks-folder'
import BookmarkEditor from './bookmark-editor'
import SelectBookmarksFolderBar from './select-bookmarks-folder-bar'

export default {
  components: {
    ScrollBox,
    Bookmark,
    Folder,
    BookmarkEditor,
    SelectBookmarksFolderBar,
  },

  props: {
    active: Boolean,
    index: Number,
  },

  data() {
    return {
      editor: false,
      renderable: false,
      visible: false,
      lastScrollY: 0,
    }
  },

  watch: {
    // If bookmarks too many, do not render
    // them when panel is inactive
    async active(c, p) {
      const scrollBox = this.$refs.scrollBox
      if (!scrollBox) return

      // Activation
      if (c && !p) {
        if (State.bookmarks.length === 0) {
          await Actions.loadBookmarks(State)
        }

        setTimeout(() => {
          this.renderable = true
          setTimeout(() => {
            if (!this.visible) scrollBox.setScrollY(this.lastScrollY)
            this.visible = true
          }, 16)
        }, 16)
      }

      // Deactivation
      if (!c) {
        scrollBox.recalcScroll()
        if (scrollBox.contentHeight < scrollBox.boxHeight << 2) {
          this.renderable = true
          this.visible = true
          return
        }
        setTimeout(() => {
          this.lastScrollY = this.$refs.scrollBox.scrollY
          this.renderable = false
          setTimeout(() => {
            this.visible = false
          }, 16)
        }, 120)
      }
    },
  },

  async created() {
    // Render if this panel is active
    if (State.panelIndex === this.index) {
      this.renderable = true
      setTimeout(() => { this.visible = true }, 16)
    }
  },

  mounted() {
    EventBus.$on('recalcPanelScroll', this.recalcScroll)
    EventBus.$on('updatePanelBounds', this.updatePanelBounds)
    EventBus.$on('scrollBookmarksToEdge', this.scrollToEdge)
  },

  beforeDestroy() {
    EventBus.$off('recalcPanelScroll', this.recalcScroll)
    EventBus.$off('updatePanelBounds', this.updatePanelBounds)
    EventBus.$off('scrollBookmarksToEdge', this.scrollToEdge)
  },

  methods: {
    onClick() {
      Actions.closeCtxMenu()
    },

    onStartSelection(event) {
      this.$emit('start-selection', event)
    },

    onRightMouseUp(e) {
      if (State.selected.length) return Actions.resetSelection()

      let panel = State.panels[this.index]
      if (!panel) return

      e.stopPropagation()

      let type
      if (panel.type === 'bookmarks') type = 'bookmarksPanel'
      else if (panel.type === 'default') type = 'tabsPanel'
      else if (panel.type === 'ctx') type = 'tabsPanel'

      State.selected = [panel]
      Actions.openCtxMenu(type, e.clientX, e.clientY)
    },

    /**
     * Handle context menu event
     */
    onNavCtxMenu(e) {
      if (
        !State.ctxMenuNative ||
        e.ctrlKey ||
        e.shiftKey
      ) {
        e.stopPropagation()
        e.preventDefault()
        return
      }

      let panel = State.panels[this.index]
      if (!panel) return

      let nativeCtx = { showDefaults: false }
      browser.menus.overrideContext(nativeCtx)

      let type
      if (panel.type === 'bookmarks') type = 'bookmarksPanel'
      else if (panel.type === 'default') type = 'tabsPanel'
      else if (panel.type === 'ctx') type = 'tabsPanel'
      if (!State.selected.length) State.selected = [panel]

      Actions.openCtxMenu(type)
    },

    /**
     * Calculate bookmarks bounds
     */
    updatePanelBounds() {
      if (State.panelIndex !== this.index) return

      const b = this.$el.getBoundingClientRect()
      State.panelTopOffset = b.top
      State.panelLeftOffset = b.left
      State.panelScrollEl = this.getScrollEl()

      // probe bookmarks height
      const compStyle = getComputedStyle(this.$el)
      const fhRaw = compStyle.getPropertyValue('--bookmarks-folder-height')
      const fh = Utils.parseCSSNum(fhRaw.trim())[0]
      const fc = fh >> 1
      const fe = fc >> 1
    
      const bhRaw = compStyle.getPropertyValue('--bookmarks-bookmark-height')
      const bh = Utils.parseCSSNum(bhRaw.trim())[0]
      const bc = bh >> 1
      const be = bc >> 1

      const shRaw = compStyle.getPropertyValue('--bookmarks-separator-height')
      const sh = Utils.parseCSSNum(shRaw.trim())[0]
      const sc = sh >> 1
      const se = sc >> 1

      let overallHeight = 0
      let h, c, e
      const bounds = []
      const walker = nodes => {
        for (let i = 0; i < nodes.length; i++) {
          const n = nodes[i]

          if (n.type === 'folder') {
            h = fh
            c = fc
            e = fe
          }
          if (n.type === 'bookmark') {
            h = bh
            c = bc
            e = be
          }
          if (n.type === 'separator') {
            h = sh
            c = sc
            e = se
          }

          bounds.push({
            type: 'bookmark',
            id: n.id,
            index: n.index,
            in: n.type === 'folder',
            folded: !n.expanded,
            parent: n.parentId,
            start: overallHeight,
            top: overallHeight + e,
            center: overallHeight + c,
            bottom: overallHeight + c + e,
            end: overallHeight + h,
          })

          overallHeight += h

          if (n.children && n.expanded) {
            walker(n.children)
          }
        }
      }
      walker(State.bookmarks)

      State.itemSlots = bounds
    },

    /**
     * Return scroll-box element
     */
    getScrollEl() {
      if (!this.$refs.scrollBox) return
      else return this.$refs.scrollBox.getScrollBox()
    },

    /**
     * Recalculate scroll possition
     */
    recalcScroll() {
      if (this.index !== State.panelIndex) return
      if (this.$refs.scrollBox) {
        this.$refs.scrollBox.recalcScroll()
      }
    },

    /**
     * Try to scroll to bottom / top
     */
    scrollToEdge() {
      let scrollBoxEl = this.getScrollEl()
      if (!scrollBoxEl) return

      if (!this.$refs.scrollBox) return
      let scrollableBoxEl = this.$refs.scrollBox.getScrollableBox()
      if (!scrollableBoxEl) return
      
      if (scrollBoxEl.scrollTop === 0) {
        scrollableBoxEl.scrollIntoView({ behavior: 'smooth', block: 'end'})
      } else {
        scrollableBoxEl.scrollIntoView({ behavior: 'smooth', block: 'start'})
      }
    },
  },
}
</script>
