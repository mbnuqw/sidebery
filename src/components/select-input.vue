<template lang="pug">
.SelectInput(:data-color="props.color" :data-folded="folded" :data-opened="opened")
  template(v-if="folded && activeOpt")
    .opt(
      :title="getTooltip(activeOpt)"
      :data-none="activeOpt === props.noneOpt"
      :data-color="getOptColor(activeOpt) ?? false"
      data-active="true")
        svg(v-if="props.icon || getOptIcon(activeOpt)")
          use(:xlink:href="'#' + (props.icon || getOptIcon(activeOpt))")
        p(v-else-if="props.label") {{translate(props.label + activeOpt, props.plurNum)}}
    .opt.-exp(v-if="folded")
      svg: use(xlink:href="#icon_expand")
    .list
      .opt(
        v-for="opt in inactiveOpts"
        :title="getTooltip(opt)"
        :data-none="opt === props.noneOpt"
        :data-color="getOptColor(opt) ?? false"
        :data-active="isActive(opt)"
        @mousedown.stop="select(opt)")
          svg(v-if="props.icon || getOptIcon(opt)")
            use(:xlink:href="'#' + (props.icon || getOptIcon(opt))")
          p(v-else-if="props.label") {{translate(props.label + opt, props.plurNum)}}
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
import { computed } from 'vue'
import { translate } from 'src/dict'

type InputObjOpt = {
  value: string | number
  tooltip?: string
  color?: string
  icon?: string
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
  opened?: boolean
}

const emit = defineEmits(['update:value'])
const props = withDefaults(defineProps<SelectInputProps>(), { noneOpt: 'none', opened: false })

const activeOpt = computed<InputOption>(() => {
  if (!props.folded) return props.noneOpt
  return props.opts.find(isActive) ?? props.noneOpt
})
const inactiveOpts = computed<InputOption[]>(() => {
  if (!props.folded) return []
  return props.opts.filter(opt => !isActive(opt))
})

function optIsObj(opt: InputOption): opt is InputObjOpt {
  if ((opt as InputObjOpt).value !== undefined || (opt as InputObjOpt).value !== null) return true
  return false
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
</script>
