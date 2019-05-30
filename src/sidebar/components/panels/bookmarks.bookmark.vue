<template lang="pug">
.Bookmark(
  :data-selected="selected"
  :data-opened="node.opened"
  :data-favless="!favicon")
  .body(:title="tooltip", @click="onClick", @mousedown="onMouseDown", @mouseup="onMouseUp")
    .drag-layer(draggable="true", @dragstart="onDragStart")
    .fav
      .placeholder: svg: use(xlink:href="#icon_ff")
      img(:src="favicon")
    .title(v-if="node.title") {{node.title}}
</template>


<script>
import EventBus from '../../../event-bus'
import State from '../../store/state'
import Actions from '../../actions'

export default {
  props: {
    node: Object,
    editNode: String,
  },

  data() {
    return {
      selected: false,
    }
  },

  computed: {
    favicon() {
      if (!this.node.host) return
      return State.favicons[this.node.host]
    },

    tooltip() {
      return `${this.node.title}\n${this.node.url}`
    },
  },

  created() {
    EventBus.$on('selectBookmark', this.onBookmarkSelection)
    EventBus.$on('deselectBookmark', this.onBookmarkDeselection)
    EventBus.$on('openBookmarkMenu', this.onBookmarkMenu)
  },

  beforeDestroy() {
    EventBus.$off('selectBookmark', this.onBookmarkSelection)
    EventBus.$off('deselectBookmark', this.onBookmarkDeselection)
    EventBus.$off('openBookmarkMenu', this.onBookmarkMenu)
  },

  methods: {
    /**
     * Handle mouse down event.
     */
    onMouseDown(e) {
      if (e.button === 1) {
        e.preventDefault()
        if (State.selected.length) EventBus.$emit('deselectBookmark')
        else this.openUrl(true, false)
      }
      if (e.button === 2) {
        e.stopPropagation()
        this.$emit('start-selection', {
          type: 'bookmark',
          clientY: e.clientY,
          ctrlKey: e.ctrlKey,
          id: this.node.id,
        }, [this.node])
      }
    },

    /**
     * Handle mouseup event
     */
    onMouseUp(e) {
      if (e.button === 2) {
        Actions.closeCtxMenu(State)
        // Select this bookmark
        if (!State.selected.length) {
          State.selected = [this.node.id]
          this.selected = true
        }
      }
    },

    /**
     * Handle click event. 
     */
    onClick() {
      if (State.selected.length) {
        State.selected = []
        EventBus.$emit('deselectBookmark')
        return
      }
      
      if (State.actOpenedTab && this.node.opened) {
        const tab = State.tabs.find(t => t.url === this.node.url)
        if (tab) {
          browser.tabs.update(tab.id, { active: true })
          return
        }
      }
      this.openUrl(State.openBookmarkNewTab, true)
    },

    /**
     * Handle bookmark selection
     */
    onBookmarkSelection(id) {
      if (this.node.id === id) this.selected = true
    },

    /**
     * Handle bookmark deselection
     */
    onBookmarkDeselection(id) {
      if (!id) this.selected = false
      if (id && this.node.id === id) this.selected = false
    },

    /**
     * Open bookmark menu
     */
    onBookmarkMenu(id) {
      if (id !== this.node.id) return
      Actions.openCtxMenu(State, this.$el.childNodes[0], this.node)
    },

    /**
     * Handle dragstart event.
     */
    onDragStart(e) {
      // Hide context menu (if any)
      if (State.ctxMenu) State.ctxMenu = null

      // Check what to drag
      const toDrag = [this.node.id]
      const nodesToDrag = []
      if (!State.selected.length) nodesToDrag.push(this.node)
      const walker = nodes => {
        for (let node of nodes) {
          if (toDrag.includes(node.parentId)) {
            toDrag.push(node.id)
            nodesToDrag.push(node)
          }
          if (State.selected.includes(node.id)) {
            toDrag.push(node.id)
            nodesToDrag.push(node)
          }
          if (node.type === 'folder') walker(node.children)
        }
      }
      walker(State.bookmarks)

      // Set drag info
      e.dataTransfer.setData('text/x-moz-text-internal', this.node.url)
      e.dataTransfer.setData('text/uri-list', this.node.url)
      e.dataTransfer.setData('text/plain', this.node.url)
      e.dataTransfer.effectAllowed = 'move'
      const dragData = nodesToDrag.map(n => {
        return {
          type: n.type,
          id: n.id,
          parentId: n.parentId,
          index: n.index,
          incognito: State.private,
          windowId: State.windowId,
          url: n.url,
          title: n.title,
        }
      })
      EventBus.$emit('dragStart', dragData)
      browser.runtime.sendMessage({
        name: 'outerDragStart',
        arg: dragData,
      })
    },

    openUrl(inNewTab, withFocus) {
      if (!this.node.url) return

      if (inNewTab) {
        let index = State.defaultPanel.endIndex + 1
        browser.tabs.create({
          index,
          windowId: State.windowId,
          url: this.node.url,
          active: withFocus,
        })
      } else {
        browser.tabs.update({ url: this.node.url })
        if (withFocus && !this.panels[0].lockedPanel) Actions.goToActiveTabPanel(State)
      }

      if (this.node.parentId === 'unfiled_____' && State.autoRemoveOther) {
        this.remove()
      }
    },

    remove() {
      if (!this.isParent) browser.bookmarks.remove(this.node.id)
      else browser.bookmarks.removeTree(this.node.id)
    },
  },
}
</script>
