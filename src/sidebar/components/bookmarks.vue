<template lang="pug">
.Bookmarks(
  :drag-active="drag && drag.dragged"
  :drag-end="dragEnd"
  :ctx-menu="!!ctxMenuOpened"
  :editing="editor"
  :not-renderable="!renderable"
  :invisible="!visible"
  @click="onClick"
  @mouseup="onMU"
  @mouseleave="onMU")
  scroll-box(ref="scrollBox", @auto-scroll="onMM")
    .drag-box
      .drag-node(
        v-for="n in flat"
        ref="flat"
        :key="n.id"
        :style="flatNodeStyle(n)"
        :dragged="drag && drag.node.id === n.id && drag.dragged"
        :n-type="n.type"
        :exp="n.expanded && n.children.length > 0")
        .exp(v-if="n.expanded && n.children.length")
          svg: use(xlink:href="#icon_expand")
        .fav(v-if="n.type === 'bookmark'")
          .placeholder(v-if="!n.fav")
          img(v-else, :src="n.fav")
        .title {{n.title}}
    b-node.node(
      v-for="n in $store.state.bookmarks"
      ref="nodes"
      :key="n.id"
      :node="n"
      :recalc-scroll="recalcScroll"
      @md="onNodeMD"
      @expand="onFolderExpand"
      @create="onCreate"
      @edit="onEdit")

  bookmarks-editor.editor(
    ref="editor"
    :is-active="editor"
    @cancel="onEditorCancel"
    @create="onEditorOk"
    @change="onEditorOk")
</template>


<script>
import { mapGetters } from 'vuex'
import Utils from '../../libs/utils'
import Logs from '../../libs/logs'
import Store from '../store'
import State from '../store.state'
import EventBus from '../event-bus'
import ScrollBox from './scroll-box.vue'
import BNode from './bookmarks.node.vue'
import BookmarksEditor from './bookmarks.editor.vue'

export default {
  components: {
    ScrollBox,
    BNode,
    BookmarksEditor,
  },

  props: {
    active: Boolean,
  },

  data() {
    return {
      topOffset: 0,
      drag: null,
      flat: [],
      dragEnd: false,
      editor: false,
      renderable: false,
      visible: false,
      lastScrollY: 0,
    }
  },

  computed: {
    ...mapGetters(['ctxMenuOpened']),
  },

  watch: {
    // If bookmarks too many, do not render
    // them when panel is inactive
    active(c, p) {
      const scrollBox = this.$refs.scrollBox
      if (!scrollBox) return

      // Activation
      if (c && !p) {
        setTimeout(() => {
          this.renderable = true
          setTimeout(() => {
            if (!this.visible) scrollBox.setScrollY(this.lastScrollY)
            this.visible = true
          }, 16)
        }, 128)
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
          setTimeout(() => {this.visible = false}, 16)
        }, 128)
      }
    },
  },

  async created() {
    browser.bookmarks.onCreated.addListener(this.onCreated)
    browser.bookmarks.onChanged.addListener(this.onChanged)
    browser.bookmarks.onMoved.addListener(this.onMoved)
    browser.bookmarks.onRemoved.addListener(this.onRemoved)

    // Setup global events listeners
    EventBus.$on('bookmarks.collapseAll', this.collapseAll)
    EventBus.$on('bookmarks.reloadBookmarks', this.reloadBookmarks)
    EventBus.$on('bookmarks.render', () => {
      if (this.active) {
        this.$nextTick(() => {
          this.renderable = true
          setTimeout(() => {
            this.visible = true
          }, 16)
        })
      }
    })
  },

  mounted() {
    this.topOffset = this.$el.getBoundingClientRect().top

    const onmove = Utils.Asap(this.onMM)
    this.$el.addEventListener('mousemove', onmove.func)
  },

  beforeDestroy() {
    browser.bookmarks.onCreated.removeListener(this.onCreated)
    browser.bookmarks.onChanged.removeListener(this.onChanged)
    browser.bookmarks.onMoved.removeListener(this.onMoved)
    browser.bookmarks.onRemoved.removeListener(this.onRemoved)
  },

  methods: {
    onClick() {
      Store.commit('closeCtxMenu')
    },

    onMM(e) {
      if (!this.drag) return
      if (this.drag.lvl === 0) return

      if (
        (!this.drag.dragged && Math.abs(e.clientY - this.drag.y) > 5) ||
        (!this.drag.dragged && Math.abs(e.clientX - this.drag.x) > 5)
      ) {
        this.drag.dragged = true
        this.updateFlatLayout()
      }

      if (this.drag.dragged) {
        if (!this.$refs.flat || !this.$refs.flat[this.drag.i]) return
        let moveY = e.clientY - this.topOffset + this.$refs.scrollBox.scrollY
        let y
        let x

        for (let i = 0; i < this.flat.length; i++) {
          let node = this.flat[i]

          // Dragged node - just skip
          if (i === this.drag.i) continue

          // Nodes BEFORE dragged
          if (i < this.drag.i) {
            if (node.top > moveY - node.h) {
              // - [Dragged Node] UP
              // ...
              // -> You here
              // - OLD PLACE
              y = node.top + this.drag.h
            } else {
              // ...
              // -> You here
              // - [Dragged Node] UP
              // - OLD PLACE
              this.drag.target = i + 1
              y = node.top
            }
            x = 12 * node.lvl
          }

          // Nodes AFTER dragged
          if (i > this.drag.i) {
            if (node.top > moveY) {
              // - OLD PLACE
              // - [Dragged Node] DOWN
              // -> You here
              // ...
              y = node.top
            } else {
              // - OLD PLACE
              // ...
              // -> You here
              // - [Dragged Node] DOWN
              this.drag.target = i
              y = node.top - this.drag.h
            }
            x = 12 * node.lvl
          }

          if (y !== this.$refs.flat[i].lastY || x !== this.$refs.flat[i].lastX) {
            this.$refs.flat[i].style.transform = `translate(${x}px, ${y}px)`
            this.$refs.flat[i].lastY = y
            this.$refs.flat[i].lastX = x
          }
        }

        let prev
        let next

        if (this.drag.target < this.drag.i) {
          // UP
          prev = this.flat[this.drag.target - 1]
          next = this.flat[this.drag.target]
        }
        if (this.drag.target === this.drag.i) {
          prev = this.flat[this.drag.target - 1]
          next = this.flat[this.drag.target + 1]
        }
        if (this.drag.target > this.drag.i) {
          prev = this.flat[this.drag.target]
          next = this.flat[this.drag.target + 1]
          // DOWN
        }
        let prevFolder = prev && prev.type === 'folder'

        // Between...
        if (prev && next) {
          if (prevFolder) {
            if (prev.lvl < next.lvl) {
              //   > folder
              //     * dragged
              //     - whatever
              this.drag.lvl = next.lvl
            } else {
              //   < folder
              //   *-* dragged
              //   - whatever
              this.drag.lvl = this.drag.x > e.clientX ? prev.lvl : prev.lvl + 1
            }
          } else {
            if (prev.lvl > next.lvl) {
              //    - not folder
              //  *-* dragged
              //  - whatever
              this.drag.lvl = this.drag.x > e.clientX ? prev.lvl - 1 : prev.lvl
            } else {
              //  - node
              //  * dragged
              //  - whatever
              this.drag.lvl = prev.lvl
            }
          }
        }

        // Last
        if (prev && !next) {
          this.drag.lvl = 1
        }

        // Non-zero
        if (this.drag.lvl === 0) {
          this.drag.lvl = 1
        }

        // Reset highlight of old folders
        if (this.drag.path[this.drag.lvl] !== undefined) {
          let index = this.drag.path.pop()
          if (this.$refs.flat[index]) {
            this.$refs.flat[index].setAttribute('drag-parent', false)
          }
        }

        // Set highlight for folder in current path
        let j = this.drag.target
        if (this.drag.i < this.drag.target) j++
        let l = this.drag.lvl
        while (j--) {
          // Only folders
          if (this.flat[j].type !== 'folder') continue
          // Only parents
          if (this.flat[j].lvl < l) {
            // Only new values
            if (this.drag.path[this.flat[j].lvl] !== j) {
              let old = this.drag.path[this.flat[j].lvl]
              if (this.$refs.flat[old]) {
                this.$refs.flat[old].setAttribute('drag-parent', false)
              }
              this.$refs.flat[j].setAttribute('drag-parent', true)
              this.drag.path[this.flat[j].lvl] = j
            }
            // Go to lower lvl
            l--
          }

          // Ok, root
          if (this.flat[j].lvl === 0) break
        }

        let dragX = 12 * this.drag.lvl
        let dragY = moveY - this.drag.y
        if (dragY < 0) dragY = 0
        this.$refs.flat[this.drag.i].style.transform = `translate(${dragX}px, ${dragY}px)`
      }
    },

    onMU() {
      if (this.drag) {
        if (!this.drag.dragged) {
          this.drag = null
          return
        }

        // Copy drag values
        let id = this.drag.node.id
        let lvl = this.drag.lvl
        // let flatIndex = this.drag.i
        let targetIndex = this.drag.target

        // Get target index and parantId
        let index = 0
        let parentId
        if (targetIndex > this.drag.i) targetIndex++
        for (let i = targetIndex; i--; ) {
          if (this.flat[i].id === id) continue
          if (this.flat[i].lvl > lvl) continue
          if (this.flat[i].lvl === lvl) index++
          if (this.flat[i].lvl < lvl) {
            parentId = this.flat[i].id
            break
          }
        }
        if (!parentId) {
          this.drag = null
          setTimeout(() => {
            this.flat = null
          }, 128)
          return
        }

        // Update actual nodes order
        browser.bookmarks.move(id, { parentId, index })

        // Set final position for dragged node
        let draggedEl = this.$refs.flat[this.drag.i]
        let targetNode = this.flat[this.drag.target]
        this.dragEnd = true
        this.$nextTick(() => {
          draggedEl.style.transform = `translate(${12 * lvl}px, ${targetNode.top}px)`
        })

        // If node position is not changed (and move event will
        // not trigger) - just reset drag state.
        if (index === this.drag.node.index) {
          setTimeout(() => {
            this.drag = null
          }, 128)
          setTimeout(() => {
            this.flat = null
            this.dragEnd = false
          }, 256)
        }
      }
    },

    onCreated(id, bookmark) {
      Logs.D(`Bookmark created, id: ${id}, type: ${bookmark.type}`)
      let added = false
      if (bookmark.type === 'folder' && !bookmark.children) bookmark.children = []
      const putWalk = nodes => {
        return nodes.map(n => {
          if (n.id === bookmark.parentId) {
            if (!n.children) n.children = []
            n.children.splice(bookmark.index, 0, bookmark)
            for (let i = bookmark.index + 1; i < n.children.length; i++) {
              n.children[i].index++
            }
            added = true
          } else if (n.children && !added) n.children = putWalk(n.children)
          return n
        })
      }

      State.bookmarks = putWalk(State.bookmarks)
    },

    onChanged(id, info) {
      let updated = false
      const updateWalk = nodes => {
        return nodes.map(n => {
          if (!n.children) return n
          let b = n.children.find(b => b.id === id)
          if (b) {
            n.children.splice(b.index, 1, {
              ...b,
              title: info.title || b.title,
              url: info.url || b.url,
            })
            updated = true
          } else if (!updated) n.children = updateWalk(n.children)
          return n
        })
      }

      State.bookmarks = updateWalk(State.bookmarks)
    },

    onMoved(id, info) {
      if (this.drag) {
        this.drag = null
        setTimeout(() => {
          this.flat = null
          this.dragEnd = false
        }, 128)
      }
      let node
      let removed = false
      const rmWalk = nodes => {
        return nodes.map(n => {
          if (n.id === info.oldParentId) {
            node = n.children.splice(info.oldIndex, 1)[0]
            node.index = info.index
            for (let i = info.oldIndex; i < n.children.length; i++) {
              n.children[i].index--
            }
            removed = true
          } else if (n.children && !removed) n.children = rmWalk(n.children)
          return n
        })
      }

      let moved = false
      const putWalk = nodes => {
        return nodes.map(n => {
          if (n.id === info.parentId) {
            if (!n.children) n.children = []
            n.children.splice(info.index, 0, node)
            for (let i = info.index + 1; i < n.children.length; i++) {
              n.children[i].index++
            }
            moved = true
          } else if (n.children && !moved) n.children = putWalk(n.children)
          return n
        })
      }

      State.bookmarks = putWalk(rmWalk(State.bookmarks))
      this.saveTreeState()
    },

    onRemoved(id, info) {
      let removed = false
      const rmWalk = nodes => {
        return nodes.map(n => {
          if (n.id === info.parentId) {
            n.children.splice(info.index, 1)
            for (let i = info.index; i < n.children.length; i++) {
              n.children[i].index--
            }
            removed = true
          } else if (n.children && !removed) n.children = rmWalk(n.children)
          return n
        })
      }

      State.bookmarks = rmWalk(State.bookmarks)
    },

    onNodeMD(e, nodes) {
      this.drag = {
        node: nodes[0],
        lvl: nodes.length - 1,
        x: e.clientX,
        y: e.clientY,
        dragged: false,
        path: [],
      }
    },

    onFolderExpand(node) {
      this.saveTreeState()
      if (State.autoCloseBookmarks && node.parentId === 'root________' && node.expanded) {
        for (let child of State.bookmarks) {
          if (child.id !== node.id
          && child.type === 'folder'
          && child.expanded) {
            const vm = this.$refs.nodes.find(c => c.node.id === child.id)
            if (!vm) continue
            vm.collapse()
          }
        }
      }
    },

    onCreate(type, path, onEndHandlers) {
      if (type === 'separator') {
        browser.bookmarks.create({
          parentId: path[0].id,
          type: 'separator',
          index: 0,
        })
        return
      }

      if (!this.$refs.editor) return
      this.$refs.editor.create(type, path)
      this.editor = true
      this.editEndHandlers = onEndHandlers
    },

    onEdit(node, path, onEndHandlers) {
      if (!this.$refs.editor) return
      this.$refs.editor.edit(node, path)
      this.editor = true
      this.editEndHandlers = onEndHandlers
    },

    onEditorCancel() {
      this.editor = false
      while (this.editEndHandlers && this.editEndHandlers[0]) {
        this.editEndHandlers.pop()()
      }
    },

    onEditorOk() {
      this.editor = false
      while (this.editEndHandlers && this.editEndHandlers[0]) {
        this.editEndHandlers.pop()()
      }
    },

    updateFlatLayout() {
      let flatTree = []
      let index = -1
      let lvl = 0
      let top = 0
      const walker = nodes => {
        for (let i = 0; i < nodes.length; i++) {
          const n = nodes[i]
          index++
          n.top = top
          n.lvl = lvl
          if (n.url) {
            let hostname = n.url.split('/')[2]
            if (hostname) n.fav = State.favicons[hostname]
          }
          if (n.type === 'bookmark') n.h = 24
          if (n.type === 'folder') n.h = 28
          if (n.type === 'separator') n.h = 17
          top += n.h
          if (n.id === this.drag.node.id) {
            this.drag.i = index
            this.drag.h = n.h
            this.drag.y = n.h >> 1
            this.drag.top = n.top
          }
          flatTree.push(n)
          if (n.children && n.expanded && n.id !== this.drag.node.id) {
            lvl++
            walker(n.children)
            lvl--
          }
        }
      }
      walker(State.bookmarks)
      this.flat = flatTree
    },

    flatNodeStyle(flatNode) {
      return {
        transform: `translate(${12 * flatNode.lvl}px, ${flatNode.top}px)`,
        height: flatNode.h + 'px',
      }
    },

    recalcScroll() {
      if (!this.active) return
      if (this.$refs.scrollBox) {
        this.$refs.scrollBox.recalcScroll()
      }
    },

    collapseAll() {
      if (!this.$refs.nodes) return
      this.$refs.nodes.map(vm => {
        vm.collapse(true)
      })
      this.saveTreeState()
    },

    async saveTreeState() {
      let expandedBookmarks = []
      let path = []
      const walker = nodes => {
        for (let i = 0; i < nodes.length; i++) {
          const n = nodes[i]
          if (n.children && n.expanded) {
            path.push(n.id)
            expandedBookmarks.push([...path])
            walker(n.children)
            path.pop()
          }
        }
      }

      walker(State.bookmarks)
      await browser.storage.local.set({
        expandedBookmarks,
      })
    },

    /**
     * Reload bookmarks without restoring
     * prev state.
     */
    async reloadBookmarks() {
      EventBus.$emit('panelLoadingStart', 0)
      try {
        let tree = await browser.bookmarks.getTree()
        State.bookmarks = tree[0].children
        EventBus.$emit('panelLoadingOk', 0)
      } catch (err) {
        Logs.E('Cannot reload bookmarks', err)
        State.bookmarks = []
        EventBus.$emit('panelLoadingErr', 0)
      }
    },
  },
}
</script>


<style lang="stylus">
@import '../../styles/mixins'

.Bookmarks
  overflow: hidden

.Bookmarks[drag-active="true"] .drag-box
  opacity: 1
  z-index: 10

.Bookmarks[drag-active="true"] .node
  opacity: 0

.Bookmarks[drag-end="true"] .drag-node[dragged]
  transition: transform var(--d-fast)

.Bookmarks[ctx-menu] .Node:not([to-front="true"]) > .body
  opacity: .4

.Bookmarks[editing] .Node:not([to-front]) > .body
  opacity: .4

.Bookmarks[not-renderable] .node
  box(none)

.Bookmarks[invisible] .node
  opacity: 0

// --- Draggable nodes ---
.Bookmarks .drag-box
  box(absolute)
  pos(0, 0)
  size(100%, same)
  opacity: 0
  z-index: -1
  transition: opacity var(--d-fast), z-index var(--d-fast)

.Bookmarks .drag-node
  box(absolute, flex)
  pos(0, 0)
  size(100%)
  align-items: center
  color: var(--c-label-fg)
  white-space: nowrap
  transition: transform var(--d-fast), opacity var(--d-fast)
  border-top-left-radius: 3px
  border-bottom-left-radius: 3px
  opacity: .4

  &[n-type="bookmark"]
    text(s: rem(14))
    padding-left: 12px
    color: var(--c-label-fg)

  &[n-type="folder"]
    text(s: rem(16))
    padding-left: 12px
    color: var(--bookmarks-folder-closed-fg)

  &[n-type="separator"]
    size(h: 17px)
    &:before
      content: ''
      box(absolute)
      pos(8px, l: 16px)
      size(calc(100% - 16px), 1px)
      border-radius: 2px
      background-image: linear-gradient(90deg, transparent, #545454, #545454, #545454)

  &[dragged]
    transition: none
    z-index: 50
    opacity: 1
    background-image: var(--bookmarks-drag-gradient)

  &[exp] > .title
    transform: translateX(12px)

  &[drag-parent="true"]
    opacity: 1

.Bookmarks .drag-node > .exp
  box(absolute)
  size(15px, same)
  flex-shrink: 0
  transform: translateX(-6px)
  transition: transform var(--d-fast), opacity var(--d-fast)

.Bookmarks .drag-node > .exp > svg
  box(absolute)
  pos(0, 0)
  size(100%, same)
  fill: var(--bookmarks-folder-open-fg)
  transform: rotateZ(0deg)
  transition: transform var(--d-fast)

.Bookmarks .drag-node > .fav
  box(relative)
  size(16px, same)
  flex-shrink: 0
  margin: 0 8px 0 0

.Bookmarks .drag-node > .fav > .placeholder
  box(absolute)
  size(3px, same)
  pos(7px, 6px)
  border-radius: 50%
  background-color: var(--fav-out)
  &:before
  &:after
    content: ''
    box(absolute)
    size(3px, same)
    border-radius: 6px
    background-color: var(--fav-out)
  &:before
    pos(0, -5px)
  &:after
    pos(0, 5px)

.Bookmarks .drag-node > .fav > img
  box(absolute)
  pos(0, 0)
  size(100%, same)

.Bookmarks .drag-node > .title
  box(relative)
  transition: transform var(--d-fast)

// --- Overflow gradient ---
.Bookmarks .fade
  box(absolute)
  pos(0, r: 0)
  size(8px, 100%)
  z-index: 1000
  background-image: var(--gr-bg-fade)

// --- Root nodes ---
.Bookmarks .node
  box(relative)
  opacity: 1
  transition: opacity var(--d-fast)
</style>
