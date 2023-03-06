<template lang="pug">
.opt(:title="title"
  :data-separator="option.startsWith('separator')"
  :data-selected="selected"
  @click="emit('select', option)")
  .opt-btn.-in(
    v-if="isTopLvl"
    :title="translate('menu.editor.create_sub_tooltip')"
    @click.stop="emit('createSubMenu', type, option)")
    svg: use(xlink:href="#icon_expand")

  .opt-title {{shrinkedTitle}}

  .opt-btn(
    :title="translate('menu.editor.down_tooltip')"
    @click.stop="emit('downOpt', type, option)")
    svg: use(xlink:href="#icon_expand")

  .opt-btn.-up(
    :title="translate('menu.editor.up_tooltip')"
    @click.stop="emit('upOpt', type, option)")
    svg: use(xlink:href="#icon_expand")

  .opt-btn.-rm(
    :title="translate('menu.editor.disable_tooltip')"
    @click.stop="emit('disableOpt', type, option)")
    svg: use(xlink:href="#icon_remove")
</template>

<script lang="ts" setup>
import { computed } from 'vue'
import { translate } from 'src/dict'
import { Menu } from 'src/services/menu'

interface MenuEditorOptionProps {
  type: string
  title: string
  selected: boolean
  isTopLvl: boolean
  option: string
  groupTitle?: string
}

const props = defineProps<MenuEditorOptionProps>()
const emit = defineEmits<{
  (e: 'select', opt: string): void
  (e: 'createSubMenu', type: string, opt: string): void
  (e: 'downOpt', type: string, opt: string): void
  (e: 'upOpt', type: string, opt: string): void
  (e: 'disableOpt', type: string, opt: string): void
}>()

const shrinkedTitle = computed<string>(() => {
  if (props.groupTitle && props.title?.startsWith(props.groupTitle)) {
    return Menu.shrinkLabel(props.groupTitle, props.title) ?? props.title
  }

  return props.title
})
</script>
