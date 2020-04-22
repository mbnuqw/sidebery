<template lang="pug">
.PinnedTab(
  :data-active="tab.active"
  :data-loading="loading"
  :data-selected="tab.sel"
  :data-audible="tab.audible"
  :data-muted="tab.mutedInfo.muted"
  :data-discarded="tab.discarded"
  :data-updated="tab.updated"
  :data-drop-slot="dropSlot"
  :data-close-btn="$store.state.showTabRmBtn"
  :data-color="color"
  :title="tooltip"
  @contextmenu.stop="onCtxMenu"
  @mousedown.stop="onMouseDown"
  @mouseup.stop="onMouseUp"
  @mouseleave="onMouseLeave"
  @dblclick.prevent.stop="onDoubleClick")
  Transition(name="tab-complete"): .complete-fx(v-if="tab.status === 'loading'")
  .drag-layer(
    draggable="true"
    @dragstart="onDragStart"
    @dragenter="onDragEnter"
    @dragleave="onDragLeave"
    @drop="onDragLeave")
  Favicon(:tab="tab" :loading="loading" :favPlaceholder="favPlaceholder" :onExp="onExp")
  Transition(name="tab-part")
    .audio-badge(v-if="tab.audible || tab.mutedInfo.muted" @mousedown.stop="" @click="onAudioClick")
      svg.-loud: use(xlink:href="#icon_loud_badge")
      svg.-mute: use(xlink:href="#icon_mute_badge")
  .ctx(v-if="color")
  .title(v-if="withTitle") {{tab.title}}
  .close(v-if="$store.state.showTabRmBtn" @mousedown.stop="close" @mouseup.stop="")
    svg: use(xlink:href="#icon_remove")
</template>

<script>
import TabMixin from '../mixins/tab'
import State from '../store/state'

export default {
  mixins: [TabMixin],

  props: {
    tab: {
      type: Object,
      default: () => ({}),
    },
    ctx: Boolean,
  },

  data() {
    return {
      dropSlot: false,
    }
  },

  computed: {
    withTitle() {
      return State.pinnedTabsPosition === 'panel' && State.pinnedTabsList
    },
  },
}
</script>
