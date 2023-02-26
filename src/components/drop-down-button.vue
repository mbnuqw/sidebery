<template lang="pug">
.DropDownButton(
  ref="rootEl"
  :data-drop-down="dropDownOpen"
  @click="open"
  @contextmenu.stop.prevent
  @blur="onBlur")
  .body
    .label {{label}}
    teleport(v-if="!disabledDropDownTeleport" to="#root")
      .DropDownButton-drop-down-layer(v-if="dropDownOpen" @wheel="onWheel" @mouseup="onMouseUp")
        .DropDownButton-drop-down(ref="dropDownEl" :style="dropDownStyle")
          slot
</template>

<script lang="ts" setup>
import { ref, nextTick, onMounted, reactive } from 'vue'
import * as Utils from 'src/utils'

interface Props {
  label: string
}

defineProps<Props>()
const emit = defineEmits(['open'])
const dropDownOpen = ref(false)
const rootEl = ref<HTMLElement | null>(null)
const dropDownEl = ref<HTMLElement | null>(null)
const disabledDropDownTeleport = ref(true)
const dropDownStyle = reactive({
  '--left': '0px',
  '--top': '0px',
} as Record<string, string>)

onMounted(() => {
  setupDropDownTeleport()
})

function setupDropDownTeleport() {
  disabledDropDownTeleport.value = false
}

function onBlur(): void {
  if (rootEl.value) rootEl.value.tabIndex = -1
}

async function onMouseUp() {
  await Utils.sleep(3)

  if (rootEl.value && rootEl.value.tabIndex === -1 && dropDownOpen.value) {
    dropDownOpen.value = false
  }
}

function onWheel(e: WheelEvent): void {
  if (!dropDownEl.value) return

  const scrollOffset = dropDownEl.value.scrollTop
  const maxScrollOffset = dropDownEl.value.scrollHeight - dropDownEl.value.offsetHeight
  if (scrollOffset === 0 && e.deltaY < 0) e.preventDefault()
  if (scrollOffset === maxScrollOffset && e.deltaY > 0) e.preventDefault()
}

async function open() {
  if (!rootEl.value) return

  if (rootEl.value) {
    rootEl.value.tabIndex = 0
    rootEl.value.focus()
  }

  dropDownOpen.value = true
  emit('open')

  const elStyles = window.getComputedStyle(rootEl.value, null)
  let bottomPadding = parseInt(elStyles.getPropertyValue('padding-bottom'))
  if (isNaN(bottomPadding)) bottomPadding = 0

  await nextTick()
  if (!dropDownEl.value) return

  const inputRect = rootEl.value.getBoundingClientRect()
  const dropDownRect = dropDownEl.value.getBoundingClientRect()

  const viewportHeight = window.innerHeight
  const viewportWidth = window.innerWidth
  const inputBottom = Math.round(inputRect.bottom)
  const inputRight = Math.round(inputRect.right)

  let dropDownTop = inputBottom - bottomPadding + 1
  if (viewportHeight <= dropDownTop + dropDownRect.height + bottomPadding) {
    dropDownTop = viewportHeight - dropDownRect.height - bottomPadding
  }

  if (viewportWidth < dropDownRect.width + (viewportWidth - inputRight)) {
    const inputWidth = Math.round(inputRect.width)
    dropDownStyle['--max-width'] = `${inputWidth}px`
    dropDownRect.width = inputWidth
  }

  dropDownStyle['--top'] = `${dropDownTop}px`
  dropDownStyle['--left'] = `${inputRight - dropDownRect.width}px`
}
</script>
