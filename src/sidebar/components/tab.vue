<template lang="pug">
.Tab(
  :data-active="tab.active"
  :data-loading="loading"
  :data-selected="tab.sel"
  :data-audible="tab.audible"
  :data-muted="tab.mutedInfo.muted"
  :data-discarded="tab.discarded"
  :data-updated="tab.updated"
  :data-lvl="tab.lvl"
  :data-parent="tab.isParent"
  :data-folded="tab.folded"
  :data-invisible="tab.invisible"
  :data-color="color"
  :data-unread="tab.unread"
  :title="tooltip"
  @contextmenu.stop="onCtxMenu"
  @mousedown.stop="onMouseDown"
  @mouseup.stop="onMouseUp"
  @mouseleave.passive="onMouseLeave"
  @dblclick.prevent.stop="onDoubleClick"): .lvl-wrapper
  transition(name="tab-complete"): .complete-fx(v-if="tab.status === 'loading'")
  .drag-layer(
    draggable="true"
    @dragstart="onDragStart"
    @dragenter="onDragEnter"
    @dragleave="onDragLeave")
  transition(name="tab-part")
    .audio(v-if="tab.audible || tab.mutedInfo.muted" @mousedown.stop="" @click="onAudioClick")
      svg.-loud: use(xlink:href="#icon_loud_badge")
      svg.-mute: use(xlink:href="#icon_mute_badge")
  Favicon(
    :tab="tab"
    :loading="loading"
    :favPlaceholder="favPlaceholder"
    :childCount="childCount"
    :onExp="onExp")
  .close(
    v-if="$store.state.showTabRmBtn"
    @mousedown.stop="onCloseClick"
    @mouseup.stop=""
    @contextmenu.stop.prevent="")
    svg: use(xlink:href="#icon_remove")
  .ctx(v-if="$store.state.showTabCtx && color")
  .t-box: .title {{tab.title}}
</template>

<script>
import TabMixin from '../mixins/tab'
import State from '../store/state'
import Actions from '../actions'

export default {
  mixins: [TabMixin],

  props: {
    childCount: Number,
    tab: {
      type: Object,
      default: () => ({}),
    },
  },

  methods: {
    /**
     * Handle mousedown event on expand button
     */
    onExp(e) {
      // Fold/Expand branch
      if (e.button === 0) {
        if (State.ctxMenu) Actions.closeCtxMenu()
        Actions.toggleBranch(this.tab.id)
      }

      // Select whole branch and show menu
      if (e.button === 2) {
        if (e.ctrlKey || e.shiftKey) return

        Actions.resetSelection()
        this.tab.sel = true
        State.selected.push(this.tab.id)
        for (let tab, i = this.tab.index + 1; i < State.tabs.length; i++) {
          tab = State.tabs[i]
          if (tab.lvl <= this.tab.lvl) break

          tab.sel = true
          State.selected.push(tab.id)
        }
      }
    },

    /**
     * Handle click on close btn
     */
    onCloseClick(e) {
      if (e.button === 0) this.close()
      if (e.button === 1) this.close()
      if (e.button === 2) this.closeTree()
    },

    /**
     * Close tabs tree
     */
    closeTree() {
      const toRemove = [this.tab.id]
      for (let tab of State.tabs) {
        if (toRemove.includes(tab.parentId)) toRemove.push(tab.id)
      }
      Actions.removeTabs(toRemove)
    },
  },
}
</script>
