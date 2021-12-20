<template lang="pug">
.Separator(:data-selected="node.sel")
  .body(
    @mousedown.stop="onMouseDown"
    @mouseup.stop="onMouseUp"
    @contextmenu.stop="onCtxMenu")
    .drag-layer(draggable="true" @dragstart="onDragStart")
</template>

<script>
import EventBus from '../../event-bus'
import State from '../store/state'
import Actions from '../actions'

export default {
  name: 'BNode',
  props: {
    node: Object,
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
          if (typeof State.selected[0] !== 'string') return

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
      }

      if (e.button === 2) {
        if (e.ctrlKey || e.shiftKey) return

        Actions.stopMultiSelection()
        if (!State.ctxMenuNative) {
          Actions.selectItem(this.node.id)
          Actions.openCtxMenu('bookmark', e.clientX, e.clientY)
        }
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

      Actions.openCtxMenu('bookmark')
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

    remove() {
      if (!this.isParent) browser.bookmarks.remove(this.node.id)
      else browser.bookmarks.removeTree(this.node.id)
    },
  },
}
</script>
