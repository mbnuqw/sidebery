<template lang="pug">
.SelectInput(ref="rootEl" :data-color="props.color" :data-folded="folded")
  template(v-if="folded && activeOpt")
    .opt(
      :title="getTooltip(activeOpt)"
      :data-none="((activeOpt as InputObjOpt).value ?? activeOpt) === props.noneOpt"
      :data-color="getOptColor(activeOpt) ?? false"
      data-active="true")
        svg(v-if="props.icon || getOptIcon(activeOpt)")
          use(:xlink:href="'#' + (props.icon || getOptIcon(activeOpt))")
        p(v-else-if="props.label") {{translate(props.label + activeOpt, props.plurNum)}}
        p(v-if="(activeOpt as InputObjOpt).title") {{(activeOpt as InputObjOpt).title}}
    .opt.-exp(v-if="folded")
      svg: use(xlink:href="#icon_expand")
    teleport(v-if="folded && !disabledDropDownTeleport" to="#root")
      .select-input-drop-down-layer(v-if="isOpen" @wheel="onWheel")
        .select-input-drop-down(ref="dropDownEl" :style="dropDownStyle")
          .opt(
            v-for="opt in inactiveOpts"
            :title="getTooltip(opt)"
            :data-none="((opt as InputObjOpt).value ?? opt) === props.noneOpt"
            :data-color="getOptColor(opt) ?? false"
            :data-active="isActive(opt)"
            @mousedown.stop="select(opt)")
              svg(v-if="props.icon || getOptIcon(opt)")
                use(:xlink:href="'#' + (props.icon || getOptIcon(opt))")
              p(v-else-if="props.label") {{translate(props.label + opt, props.plurNum)}}
              p(v-if="(opt as InputObjOpt).title") {{(opt as InputObjOpt).title}}
  template(v-else)
    .opt(
      v-for="opt in props.opts"
      :title="getTooltip(opt)"
      :data-none="((opt as InputObjOpt).value ?? opt) === props.noneOpt"
      :data-color="getOptColor(opt) ?? false"
      :data-active="isActive(opt)"
      @mousedown.stop="select(opt)")
        svg(v-if="props.icon || getOptIcon(opt)")
          use(:xlink:href="'#' + (props.icon || getOptIcon(opt))")
        p(v-else-if="props.label") {{translate(props.label + opt, props.plurNum)}}
</template>

<script lang="ts" setup>
import { computed, ref, reactive, onMounted, nextTick } from 'vue'
import { translate } from 'src/dict'
import { SelectInputComponent } from 'src/types'

type InputObjOpt = {
  value: string | number
  tooltip?: string
  color?: string
  icon?: string
  title?: string
}
type InputOption = string | number | InputObjOpt

interface SelectInputProps {
  value: InputOption | InputOption[]
  opts: readonly InputOption[]
  label?: string
  plurNum?: number | string
  color?: string
  icon?: string
  noneOpt?: string | number
  folded?: boolean
}

const BOTTOM_PADDING_PX = 8

const rootEl = ref<HTMLElement | null>(null)
const dropDownEl = ref<HTMLElement | null>(null)
const disabledDropDownTeleport = ref(true)
const isOpen = ref(false)
const emit = defineEmits(['update:value'])
const props = withDefaults(defineProps<SelectInputProps>(), { noneOpt: 'none' })
const dropDownStyle = reactive({
  '--left': '0px',
  '--top': '0px',
} as Record<string, string>)

const activeOpt = computed<InputOption>(() => {
  if (!props.folded) return props.noneOpt
  return props.opts.find(isActive) ?? props.noneOpt
})
const inactiveOpts = computed<InputOption[]>(() => {
  if (!props.folded) return []
  return props.opts.filter(opt => !isActive(opt))
})

onMounted(() => {
  setupDropDownTeleport()
})

function setupDropDownTeleport() {
  disabledDropDownTeleport.value = false
}

function getOptColor(opt: InputOption): string | undefined {
  return (opt as InputObjOpt).color
}

function getOptIcon(opt: InputOption): string | undefined {
  return (opt as InputObjOpt).icon
}

function isActive(opt: InputOption): boolean {
  if (Array.isArray(props.value)) {
    const val = opt instanceof Object ? opt.value : opt
    return props.value.includes(val)
  } else {
    if (opt instanceof Object) return (opt as InputObjOpt).value === props.value
    else return props.value === opt
  }
}

function select(option: InputOption): void {
  if (Array.isArray(props.value)) {
    const val = option instanceof Object ? option.value : option
    const index = props.value.indexOf(val)
    if (index === -1) props.value.push(val)
    else props.value.splice(index, 1)

    emit('update:value', props.value)
  } else {
    if (option instanceof Object) emit('update:value', option.value)
    else emit('update:value', option)
  }
}

function getTooltip(option: InputOption): string {
  if (option && (option as InputObjOpt).tooltip) return (option as InputObjOpt).tooltip ?? ''
  return ''
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

  isOpen.value = true

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

function close() {
  isOpen.value = false
}

const publicInterface: SelectInputComponent = {
  open,
  close,
}
defineExpose(publicInterface)
</script>
