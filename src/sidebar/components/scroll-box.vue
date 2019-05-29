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
    .scrollable(v-noise:300.g:12:af.a:0:42.s:0:9="" ref="scrollContent")
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

    const onresize = Utils.asap(() => this.recalcScroll(), 128)
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
