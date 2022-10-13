<template lang="pug">
.ScrollBox(ref="el" @wheel="onWheel")
  .progress(ref="progressEl" :data-scrolling="state.scrolling")
  .top-shadow(:data-show="state.topOverflow")
  .bottom-shadow(:data-show="state.bottomOverflow")
  .scroll-container(ref="scrollBoxEl" tabindex="-1" @scroll.passive="recalcScroll(true)")
    .scrollable(ref="scrollContentEl")
      slot
</template>

<script lang="ts" setup>
import { reactive, ref, onMounted, onBeforeUnmount, nextTick } from 'vue'
import { ScrollBoxComponent } from 'src/types'
import * as Utils from 'src/utils'
import * as Logs from 'src/services/logs'

let recalcScrollOnResize: Utils.FuncCtx | null = null
let resizeObserver: ResizeObserver | null = null

const emit = defineEmits(['bottom'])
const props = defineProps({ lock: Boolean })

const el = ref<HTMLElement | null>(null)
const progressEl = ref<HTMLElement | null>(null)
const scrollBoxEl = ref<HTMLElement | null>(null)
const scrollContentEl = ref<HTMLElement | null>(null)

const state = reactive({
  topOverflow: false,
  bottomOverflow: false,
  scrolling: false,
})

let boxHeight = 0
let contentHeight = 0

onMounted(() => {
  nextTick(() => recalcScroll())

  if (!scrollBoxEl.value || !scrollContentEl.value) {
    throw Logs.err('ScrollBox: No DOM elements registered')
  }

  recalcScrollOnResize = Utils.asap(() => recalcScroll(), 180)
  resizeObserver = new ResizeObserver(recalcScrollOnResize.func)
  resizeObserver.observe(scrollBoxEl.value)
  resizeObserver.observe(scrollContentEl.value)
})

onBeforeUnmount(() => {
  if (resizeObserver) resizeObserver.disconnect()
})

function onWheel(e: WheelEvent): void {
  if (contentHeight <= boxHeight && e.deltaY > 0) emit('bottom')
  if (props.lock) e.preventDefault()
}

let hideProgress = false
let scrollingStartEndTimeout: number | undefined
function recalcScroll(progressBar?: boolean): void {
  if (!scrollBoxEl.value || !scrollContentEl.value) return
  boxHeight = scrollBoxEl.value.offsetHeight
  contentHeight = scrollContentEl.value.offsetHeight
  let contentY = scrollBoxEl.value.scrollTop

  if (!state.topOverflow && contentY > 3) state.topOverflow = true
  if (state.topOverflow && contentY < 4) state.topOverflow = false

  if (!state.bottomOverflow && contentHeight - contentY > boxHeight) {
    state.bottomOverflow = true
  }
  if (state.bottomOverflow && contentHeight - contentY <= boxHeight) {
    state.bottomOverflow = false
    emit('bottom')
  }
  if (contentHeight <= boxHeight) return

  let scrollGripY = (contentY / (contentHeight - boxHeight)) * 100
  if (progressEl.value) {
    if (contentY === 0) scrollGripY = 0
    if (scrollGripY > 100) scrollGripY = 100
    progressEl.value.style.transform = `translateX(${scrollGripY}%)`
  }

  if (progressBar && !hideProgress) {
    if (!scrollingStartEndTimeout) state.scrolling = true
    scrollingStartEndTimeout = Utils.wait(scrollingStartEndTimeout, 500, () => {
      state.scrolling = false
      scrollingStartEndTimeout = undefined
    })
  }
  if (hideProgress) hideProgress = false
}

function setScrollY(y: number): void {
  if (!scrollBoxEl.value) return
  scrollBoxEl.value.scrollTop = y
  hideProgress = true
}

function getScrollBox(): HTMLElement | null {
  return scrollBoxEl.value
}

function getScrollableBox(): HTMLElement | null {
  return scrollContentEl.value
}

const publicInterface: ScrollBoxComponent = {
  setScrollY,
  recalcScroll,
  getScrollBox,
  getScrollableBox,
}
defineExpose(publicInterface)
</script>
