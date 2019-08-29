<template lang="pug">
.Folder(
  :data-expanded="node.expanded"
  :data-parent="isParent"
  :data-selected="node.sel"
  :data-open="isOpen")
  .body(
    :title="tooltip"
    @mousedown.stop="onMouseDown"
    @mouseup.stop="onMouseUp"
    @contextmenu.stop="onCtxMenu")
    .drag-layer(draggable="true" @dragstart="onDragStart")
    .exp(v-if="isParent")
      svg: use(xlink:href="#icon_expand")
    .title(v-if="node.title") {{node.title}}
    .len(v-if="$store.state.showBookmarkLen && node.children.length") {{node.children.length}}
  transition(name="expand")
    .children(v-if="isParent" v-show="node.expanded" :title="node.title")
      component.child(
        v-for="(n, i) in node.children"
        :is="n.type"
        :key="n.id"
        :node="n"
        :edit-node="editNode"
        @start-selection="onChildStartSelection")
</template>


<script>
import EventBus from '../../event-bus'
import State from '../store/state'
import Actions from '../actions'
import Bookmark from './bookmark'
import Separator from './bookmarks-separator'

const istack = []
const tstack = []

export default {
  name: 'Folder',

  components: {
    Bookmark,
    Separator,
  },

  props: {
    node: Object,
    editNode: String,
  },

  data() {
    return {}
  },

  computed: {
    isParent() {
      return !!this.node.children && this.node.children.length > 0
    },

    tooltip() {
      return `${this.node.title}: ${this.node.children.length}`
    },

    isOpen() {
      if (!State.highlightOpenBookmarks) return false
      if (!this.node.children) return false
      let i, n, target = this.node.children
      for (i = 0; target && i < target.length; i++) {
        n = target[i]
        if (n.isOpen) {
          istack.length = 0
          tstack.length = 0
          return true
        }
        if (n.children && n.children.length) {
          if (i < target.length - 1) {
            tstack.push(target)
            istack.push(i)
          }
          target = n.children
          i = -1
          continue
        }
        if (i === target.length - 1) {
          target = tstack.pop()
          i = istack.pop()
        }
      }
      istack.length = 0
      tstack.length = 0
      return false
    },
  },

  methods: {
    /**
     * Handle mouse down event.
     */
    onMouseDown(e) {
      if (e.button === 0) this.onMouseDownLeft(e)
      if (e.button === 1) this.onMouseDownMid(e)
      if (e.button === 2) this.onMouseDownRight(e)
    },

    /**
     * Mousedown Left
     */
    onMouseDownLeft(e) {
      if (e.ctrlKey) {
        if (State.selected.length && typeof State.selected[0] !== 'string') {
          return
        }
        if (!this.node.sel) Actions.selectItem(this.node.id)
        else Actions.deselectItem(this.node.id)
        return
      }

      if (e.shiftKey) {
        if (!State.selected.length) {
          Actions.selectItem(this.node.id)
        } else {
          if (typeof State.selected[0] === 'number') return

          EventBus.$emit('updatePanelBounds')

          let first = State.bookmarksMap[State.selected[0]]
          for (let id of State.selected) {
            if (first.id === id) continue
            State.bookmarksMap[id].sel = false
          }
          State.selected = [first.id]

          let inside = false
          for (let slot of State.itemSlots) {
            if (slot.id === first.id || slot.id === this.node.id) {
              if (!inside) inside = true
              else break
            }
            if (inside) {
              State.bookmarksMap[slot.id].sel = true
              State.selected.push(slot.id)
            }
          }
        }
        return
      }
    },

    /**
     * Mousedown Mid
     */
    onMouseDownMid(e) {
      e.preventDefault()
      if (State.selected.length) {
        Actions.resetSelection()
        return
      }
      this.openUrl(true, false)
    },

    /**
     * Mousedown Right
     */
    onMouseDownRight(e) {
      if (!State.ctxMenuNative) {
        Actions.resetSelection()
        Actions.startMultiSelection({
          type: 'bookmark',
          clientY: e.clientY,
          ctrlKey: e.ctrlKey,
          id: this.node.id,
        })
      }
    },

    /**
     * Handle mouseup event
     */
    onMouseUp(e) {
      if (e.button === 0) {
        if (e.ctrlKey || e.shiftKey) return

        if (State.selected.length && !this.node.sel) {
          Actions.resetSelection()
          return
        }

        if (!this.node.expanded) Actions.expandBookmark(this.node.id)
        else Actions.foldBookmark(this.node.id)
      }

      if (e.button === 2) {
        if (e.ctrlKey || e.shiftKey) return

        Actions.stopMultiSelection()
        if (!State.ctxMenuNative) Actions.selectItem(this.node.id)
        Actions.openCtxMenu(e.clientX, e.clientY)
      }
    },

    /**
     * Handle context menu
     */
    onCtxMenu(e) {
      if (!State.ctxMenuNative || e.ctrlKey || e.shiftKey) {
        e.stopPropagation()
        e.preventDefault()
        return
      }

      if (!e.ctrlKey && !e.shiftKey && !this.node.sel) {
        Actions.resetSelection()
      }

      let nativeCtx = { context: 'bookmark', bookmarkId: this.node.id }
      browser.menus.overrideContext(nativeCtx)

      if (!State.selected.length) Actions.selectItem(this.node.id)

      Actions.openCtxMenu()
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
          } else if (State.selected.includes(node.id)) {
            toDrag.push(node.id)
            nodesToDrag.push(node)
          }
          if (node.children) walker(node.children)
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

    /**
     * Handle mouse event from child node
     */
    onChildStartSelection(event, nodes) {
      nodes.push(this.node)
      this.$emit('start-selection', event, nodes)
    },

    remove() {
      if (!this.isParent) browser.bookmarks.remove(this.node.id)
      else browser.bookmarks.removeTree(this.node.id)
    },
  },
}
</script>
