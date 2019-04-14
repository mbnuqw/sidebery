<template lang="pug">
.Folder(:is-expanded="node.expanded", :is-parent="isParent", :is-selected="selected")
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


<style lang="stylus">
@import '../../../styles/mixins'

.Folder
  box(relative)
  padding: 0 0 0 12px
  margin: 0
  border-top-left-radius: 3px
  border-bottom-left-radius: 3px
  &:before
    content: ''
    box(absolute)
    pos(0, r: 0)
    size(100vw, 100%)
    background-color: var(--tabs-selected-bg)
    z-index: -1
    opacity: 0
    transform: scale(0, 0)
    transition: opacity var(--d-fast),
                z-index var(--d-fast),
                transform 0s var(--d-fast)

  &:not([is-parent]) // Empty folder
    > .body
    > .body:hover
    > .body:active
      > .title
        color: var(--bookmarks-folder-empty-fg)
  > .body
    height: var(--bookmarks-folder-height)
    &:hover > .title
      transition: transform var(--d-fast)
      color: var(--bookmarks-folder-closed-fg-hover)
    &:active > .title
      transition: none
      color: var(--bookmarks-folder-closed-fg-active)
    > .title
      font: var(--bookmarks-folder-font)
      color: var(--bookmarks-folder-closed-fg)

// > Expanded
.Folder[is-expanded][is-parent]
  > .body
    &:hover > .title
      color: var(--bookmarks-folder-open-fg-hover)
    &:active > .title
      color: var(--bookmarks-folder-open-fg-active)
    > .title
      color: var(--bookmarks-folder-open-fg)
      mask: linear-gradient(-90deg, transparent 12px, #000000 24px, #000000)
      transform: translateX(12px)
  > .body > .exp
    transform: translateX(-6px)
    opacity: 1
  > .body > .exp > svg
    transform: rotateZ(0deg)

.Folder[is-selected="true"]
  &:before
    opacity: 1
    z-index: 0
    transform: scale(1, 1)
    transition: opacity var(--d-fast),
                z-index var(--d-fast),
                transform 0s 0s
  > .body > .title
  > .body:hover > .title
    color: var(--tabs-selected-fg)

// Body of node
.Folder > .body
  box(relative, flex)
  align-items: center
  cursor: pointer
  transform: translateZ(0)
  transition: opacity var(--d-fast)
  &:before
    content: ''
    box(absolute)
    pos(0, r: 0)
    size(100vw, 100%)

.Folder:not([is-selected]) > .body:hover:before
    background-color: var(--bookmarks-node-bg-hover)
.Folder:not([is-selected]) > .body:active:before
    background-color: var(--bookmarks-node-bg-active)

.Folder .drag-layer
  box(absolute)
  size(100%, same)
  pos(0, 0)
  z-index: 15

// Title
.Folder .title
  box(relative)
  size(100%)
  white-space: nowrap
  overflow: hidden
  transition: transform var(--d-fast), color var(--d-fast)
  mask: linear-gradient(-90deg, transparent, #000000 12px, #000000)

// Node's children box
.Folder .children
  box(relative)
  transform: translateZ(0)
  &:before
    content: ''
    box(absolute)
    size(1px, calc(100% - 11px))
    pos(0, 1px)
    background-color: #72727264
    opacity: .5
    transition: opacity var(--d-slow)
  &:hover:before
    opacity: 1

// Expanded state icon
.Folder .exp
  box(absolute)
  size(15px, same)
  margin: 1px 2px 0 0
  flex-shrink: 0
  transform: translateX(-14px)
  opacity: 0
  transition: transform var(--d-fast), opacity var(--d-fast)
.Folder .exp > svg
  box(absolute)
  pos(0, 0)
  size(100%, same)
  fill: var(--bookmarks-folder-open-fg)
  transform: rotateZ(-90deg)
  transition: transform var(--d-fast)

// --- Vue transitions ---
.expand-enter-active
  transition: opacity var(--d-norm), transform var(--d-fast)
.expand-enter
  opacity: 0
  transform: translateX(-12px)
.expand-enter-to
.expand-leave
  opacity: 1
  transform: translateX(0)
</style>
