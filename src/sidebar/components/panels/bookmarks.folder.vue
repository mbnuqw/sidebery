<template lang="pug">
.Folder(
  :is-expanded="node.expanded"
  :is-parent="isParent"
  :is-selected="selected"
  :is-opened="opened")
  .body(:title="tooltip", @click="onClick", @mousedown="onMouseDown", @mouseup="onMouseUp")
    .drag-layer(draggable="true", @dragstart="onDragStart")
    .exp(v-if="isParent")
      svg: use(xlink:href="#icon_expand")
    .title(v-if="node.title") {{node.title}}
  transition(name="expand")
    .children(v-if="isParent", v-show="node.expanded", :title="node.title")
      component.child(
        v-for="(n, i) in node.children"
        :is="n.type"
        :key="n.id"
        :node="n"
        :edit-node="editNode"
        @start-selection="onChildStartSelection")
</template>


<script>
import { mapGetters } from 'vuex'
import Store from '../../store'
import State from '../../store.state'
import EventBus from '../../event-bus'
import Bookmark from './bookmarks.bookmark'
import Separator from './bookmarks.separator'

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
    return {
      selected: false,
    }
  },

  computed: {
    ...mapGetters(['defaultPanel', 'panels']),

    isParent() {
      return !!this.node.children && this.node.children.length > 0
    },

    tooltip() {
      return `${this.node.title}: ${this.node.children.length}`
    },

    opened() {
      if (!State.selOpenedBookmarks) return false
      if (!this.node.children) return false
      let i, n, target = this.node.children
      for (i = 0; target && i < target.length; i++) {
        n = target[i]
        if (n.opened) {
          istack.length = 0
          tstack.length = 0
          return true
        }
        if (n.children) {
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
        Store.commit('closeCtxMenu')
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
      if (this.node.type === 'folder') {
        if (!this.node.expanded) Store.dispatch('expandBookmark', this.node.id)
        else Store.dispatch('foldBookmark', this.node.id)
      }
      if (this.node.type === 'bookmark') {
        this.openUrl(State.openBookmarkNewTab, true)
      }
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
      Store.dispatch('openCtxMenu', { el: this.$el.childNodes[0], node: this.node })
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
      Store.dispatch('broadcast', {
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
