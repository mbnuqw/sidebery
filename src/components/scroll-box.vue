<template lang="pug">
.ScrollBox(ref="el" @wheel="onWheel")
  .top-shadow(:data-show="state.topOverflow")
  .bottom-shadow(:data-show="state.bottomOverflow")
  .scroll-container(ref="scrollBoxEl" tabindex="-1" @scroll.passive="recalcScroll(true)")
    .scrollable(ref="scrollContentEl")
      slot
</template>

<script lang="ts" setup>
import { reactive, ref, onMounted, onBeforeUnmount } from 'vue'
import { ScrollBoxComponent } from 'src/types'
import * as Utils from 'src/utils'
import * as Logs from 'src/services/logs'

let recalcScrollOnResize: Utils.FuncCtx | null = null
let resizeObserver: ResizeObserver | null = null

const emit = defineEmits(['bottom'])
const props = defineProps<{
  lock?: boolean
  preScroll?: number
}>()

const el = ref<HTMLElement | null>(null)
const scrollBoxEl = ref<HTMLElement | null>(null)
const scrollContentEl = ref<HTMLElement | null>(null)

const state = reactive({
  topOverflow: false,
  bottomOverflow: false,
})

let boxHeight = 0
let contentHeight = 0
let _preScroll = 0

onMounted(() => {
  if (props.preScroll) _preScroll = props.preScroll

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

function recalcScroll(bottomEvent?: boolean): void {
  if (!scrollBoxEl.value || !scrollContentEl.value) return
  boxHeight = scrollBoxEl.value.offsetHeight
  contentHeight = scrollContentEl.value.offsetHeight
  let contentY = scrollBoxEl.value.scrollTop

  if (!state.topOverflow && contentY > 3) state.topOverflow = true
  if (state.topOverflow && contentY < 4) state.topOverflow = false

  if (!state.bottomOverflow && contentHeight - contentY - _preScroll > boxHeight) {
    state.bottomOverflow = true
  }
  if (state.bottomOverflow && contentHeight - contentY - _preScroll <= boxHeight) {
    state.bottomOverflow = false
    if (bottomEvent) emit('bottom')
  }
}

function setScrollY(y: number): void {
  if (!scrollBoxEl.value) return
  scrollBoxEl.value.scrollTop = y
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
