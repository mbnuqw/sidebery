<template lang="pug">
.Bookmark(:is-selected="selected")
  .body(:title="tooltip", @click="onClick", @mousedown="onMouseDown", @mouseup="onMouseUp")
    .drag-layer(draggable="true", @dragstart="onDragStart")
    .fav(:no-fav="!favicon")
      .placeholder: svg: use(xlink:href="#icon_ff")
      img(:src="favicon")
    .title(v-if="node.title") {{node.title}}
</template>


<script>
import { mapGetters } from 'vuex'
import Store from '../../store'
import State from '../../store.state'
import EventBus from '../../event-bus'

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
    ...mapGetters(['defaultPanel', 'panels']),

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
     * Collapse this node
     */
    collapse(deep = false) {
      this.node.expanded = false

      if (deep) {
        if (!this.$refs.children) return
        this.$refs.children.map(n => n.collapse(true))
      }
    },

    openUrl(inNewTab, withFocus) {
      if (!this.node.url) return

      if (inNewTab) {
        let index = this.defaultPanel.endIndex + 1
        browser.tabs.create({
          index,
          url: this.node.url,
          active: withFocus,
        })
      } else {
        browser.tabs.update({ url: this.node.url })
        if (withFocus && !this.panels[0].lockedPanel) Store.dispatch('goToActiveTabPanel')
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


<style lang="stylus">
@import '../../../styles/mixins'

.Bookmark
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

  > .body
    height: var(--bookmarks-bookmark-height)
    > .title
      font: var(--bookmarks-bookmark-font)
      color: var(--bookmarks-node-title-fg)
    &:hover > .title
      transition: transform var(--d-fast)
      color: var(--bookmarks-node-title-fg-hover)
    &:active > .title
      transition: none
      color: var(--bookmarks-node-title-fg-active)

  &[is-selected="true"]
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
.Bookmark > .body
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

.Bookmark:not([is-selected]) > .body:hover:before
    background-color: var(--bookmarks-node-bg-hover)
.Bookmark:not([is-selected]) > .body:active:before
    background-color: var(--bookmarks-node-bg-active)

.Bookmark .drag-layer
  box(absolute)
  size(100%, same)
  pos(0, 0)
  z-index: 15

// Favicon
.Bookmark .fav
  box(relative)
  size(16px, same)
  flex-shrink: 0
  margin: 0 8px 0 0
  z-index: 20
  transition: opacity var(--d-fast), transform var(--d-fast)
  &[no-fav]
    > .placeholder
      opacity: 1
      transform: translateY(0)
    > img
      opacity: 0
      transform: translateY(-4px)
.Bookmark .fav > .placeholder
  box(absolute)
  size(16px, same)
  pos(0, 0)
  opacity: 0
  transform: translateY(4px)
  transition: opacity var(--d-fast), transform var(--d-fast)
  > svg
    box(absolute)
    size(100%, same)
    pos(0, 0)
    fill: var(--favicons-placehoder-bg)

.Bookmark .fav > img
  box(absolute)
  pos(0, 0)
  size(100%, same)
  transition: opacity var(--d-fast), transform var(--d-fast)

// Title
.Bookmark .title
  box(relative)
  size(100%)
  white-space: nowrap
  overflow: hidden
  transition: transform var(--d-fast), color var(--d-fast)
  mask: linear-gradient(-90deg, transparent, #000000 12px, #000000)

// Node's children box
.Bookmark .children
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
</style>
