<template lang="pug">
.ScrollBox(@wheel="onWheel")
  .progress(ref="scroll", :data-scrolling="scrolling")
  .top-shadow(:data-show="topOverflow")
  .bottom-shadow(:data-show="bottomOverflow")
  .scroll-container(
    ref="scrollBox"
    tabindex="-1"
    v-debounce:scroll.instant.500="scrollingStartEnd"
    @scroll="recalcScroll")
    .scrollable(ref="scrollContent")
      slot
</template>


<script>
import Vue from 'vue'
import Utils from '../../libs/utils'
import Debounce from '../../directives/debounce'

Vue.directive('debounce', Debounce)

export default {
  props: {
    lock: Boolean,
  },

  data() {
    return {
      topOverflow: false,
      bottomOverflow: false,
      scrollGripY: 0,
      scrolling: false,
      scrollY: 0,
      boxHeight: 0,
      contentHeight: 0,
    }
  },

  mounted() {
    this.topOffset = this.$el.getBoundingClientRect().top
    this.$nextTick(() => this.recalcScroll())

    const onresize = Utils.Asap(() => this.recalcScroll(), 128)
    window.addEventListener('resize', onresize.func)
  },

  methods: {
    onWheel(e) {
      if (this.lock) e.preventDefault()
    },

    recalcScroll() {
      if (!this.$refs.scrollBox) return
      let boxHeight = this.$refs.scrollBox.offsetHeight
      let contentHeight = this.$refs.scrollContent.offsetHeight
      this.boxHeight = boxHeight
      this.contentHeight = contentHeight
      let contentY = this.$refs.scrollBox.scrollTop
      this.scrollY = contentY

      if (!this.topOverflow && contentY > 3) this.topOverflow = true
      if (this.topOverflow && contentY < 4) this.topOverflow = false

      if (!this.bottomOverflow && contentHeight - contentY > boxHeight) {
        this.bottomOverflow = true
      }
      if (this.bottomOverflow && contentHeight - contentY <= boxHeight) {
        this.bottomOverflow = false
      }
      if (contentHeight <= boxHeight) return

      let scrollGripY = contentY / (contentHeight - boxHeight) * 100
      if (this.$refs.scroll) {
        this.$refs.scroll.style.transform = `translateX(${scrollGripY}%)`
      }
    },

    scrollingStartEnd() {
      this.scrolling = !this.scrolling
    },

    setScrollY(y) {
      if (!this.$refs.scrollBox) return
      this.$refs.scrollBox.scrollTop = y
      this.recalcScroll()
    },

    getScrollBox() {
      return this.$refs.scrollBox
    },
  },
}
</script>


<style lang="stylus">
@import '../../styles/mixins'

.ScrollBox
  box(relative)
  size(100%, same)
  overflow: hidden

.ScrollBox > .scroll-container
  box(relative)
  size(calc(100% + 32px), 100%)
  overflow-x: hidden
  overflow-y: auto

.ScrollBox > .top-shadow
.ScrollBox > .bottom-shadow
  box(absolute)
  size(100%, 12px)
  z-index: 999
  opacity: 0
  transition: opacity var(--d-norm)
  &[data-show]
    opacity: 1

.ScrollBox > .top-shadow
  pos(-12px, 0)
  box-shadow: 0 1px 12px 0 #00000064, 0 1px 0 0 #00000012

.ScrollBox > .bottom-shadow
  pos(b: -12px, l: 0)
  box-shadow: 0 -1px 12px 0 #00000064, 0 -1px 0 0 #00000012

.ScrollBox > .progress
  box(absolute)
  pos(0, -100vw)
  size(100vw)
  height: var(--scroll-progress-h)
  background-color: var(--scroll-progress-bg)
  z-index: 1000
  opacity: 0
  transform: translateZ(0)
  transition: opacity .3s
  &[data-scrolling]
    opacity: 1
#root.-pinned-tabs-left
#root.-pinned-tabs-right
  .ScrollBox > .progress
    width: calc(100vw - 33px)
    left: calc(-100vw + 33px)

.ScrollBox > .scroll-container > .scrollable
  box(relative)
  size(100vw)
#root.-pinned-tabs-left
#root.-pinned-tabs-right
  .ScrollBox > .scroll-container > .scrollable
    width: calc(100vw - 33px)

// --- Native scroll bars ---
#root.-native-scroll
  .ScrollBox > .scroll-container
    size(100%)

  .ScrollBox > .progress
    box(none)

  .ScrollBox > .scroll-container > .scrollable
    size(100%)
</style>
