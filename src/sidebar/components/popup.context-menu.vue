<template lang="pug">
.CtxMenu(:data-active="isActive" @mousedown.stop @mouseup.stop)
  Transition(name="menu" type="transition"): .container(v-show="state.tickActive")
    .box(ref="tickEl" :style="state.tickPosStyle")
      ScrollBox
        Transition(name="sub-menu" type="transition")
          .sub-menu-box(v-if="state.sub" @click="closeSubMenu")
            .sub-menu(@click.stop)
              ScrollBox
                .opt(@click="closeSubMenu")
                  .icon-box
                    svg.icon.-rotate90: use(xlink:href="#icon_expand")
                  .label.-header {{state.sub.name}}
                .opt(:data-separator="true")
                .opt(
                  v-for="opt in state.sub.opts"
                  :data-selected="isSelected(opt)"
                  :data-separator="opt.type === 'separator'"
                  :data-inactive="opt.inactive"
                  :data-color="opt.color ? opt.color : false"
                  :title="opt.tooltip ?? opt.label"
                  @mousedown="onMouseDown($event, opt)"
                  @mouseup="onMouseUp($event, opt)")
                  .icon-box(v-if="Settings.reactive.ctxMenuRenderIcons")
                    svg.badge(v-if="opt.badge" :data-img="!!opt.img"): use(:xlink:href="'#' + opt.badge")
                    img.icon(v-if="opt.img" :src="opt.img")
                    svg.icon(v-else-if="opt.icon"): use(:xlink:href="'#' + opt.icon")
                  .label {{opt.label}}
        div(v-for="group in state.tickBlocks" :class="`${group.type}-group`")
          .icon-opt(
            v-if="group.type === 'inline'"
            v-for="opt in group.opts"
            :data-width="btnWidth(group.opts)"
            :data-selected="isSelected(opt)"
            :data-separator="opt.type === 'separator'"
            :data-color="opt.color ? opt.color : false"
            :data-inactive="opt.inactive"
            :title="opt.tooltip ?? opt.label"
            @mousedown="onMouseDown($event, opt)"
            @mouseup="onMouseUp($event, opt)")
            svg.badge(v-if="opt.badge" :data-img="!!opt.img"): use(:xlink:href="'#' + opt.badge")
            img.icon(v-if="opt.img" :src="opt.img")
            svg.icon(v-else): use(:xlink:href="'#' + opt.icon")
          .opt(
            v-if="group.type === 'list'"
            v-for="opt in group.opts"
            :data-selected="isSelected(opt)"
            :data-separator="opt.type === 'separator'"
            :data-inactive="opt.inactive"
            :data-color="opt.color ? opt.color : false"
            :title="opt.tooltip ?? opt.label"
            @mousedown="onMouseDown($event, opt)"
            @mouseup="onMouseUp($event, opt)")
            .icon-box(v-if="Settings.reactive.ctxMenuRenderIcons")
              svg.badge(v-if="opt.badge" :data-img="!!opt.img"): use(:xlink:href="'#' + opt.badge")
              img.icon(v-if="opt.img" :src="opt.img")
              svg.icon(v-else-if="opt.icon"): use(:xlink:href="'#' + opt.icon")
            .label {{opt.label}}
            .icon-box(v-if="opt.sub")
              svg.icon.-rotate-90: use(xlink:href="#icon_expand")
  Transition(name="menu" type="transition"): .container(v-show="state.tackActive")
    .box(ref="tackEl" :style="state.tackPosStyle")
      ScrollBox
        Transition(name="sub-menu" type="transition")
          .sub-menu-box(v-if="state.sub" @click="closeSubMenu")
            .sub-menu(@click.stop)
              ScrollBox
                .opt(@click="closeSubMenu")
                  .icon-box
                    svg.icon.-rotate90: use(xlink:href="#icon_expand")
                  .label.-header {{state.sub.name}}
                .opt(:data-separator="true")
                .opt(
                  v-for="opt in state.sub.opts"
                  :data-selected="isSelected(opt)"
                  :data-separator="opt.type === 'separator'"
                  :data-inactive="opt.inactive"
                  :data-color="opt.color ? opt.color : false"
                  :title="opt.tooltip ?? opt.label"
                  @mousedown="onMouseDown($event, opt)"
                  @mouseup="onMouseUp($event, opt)")
                  .icon-box(v-if="Settings.reactive.ctxMenuRenderIcons")
                    svg.badge(v-if="opt.badge" :data-img="!!opt.img"): use(:xlink:href="'#' + opt.badge")
                    img.icon(v-if="opt.img" :src="opt.img")
                    svg.icon(v-else-if="opt.icon"): use(:xlink:href="'#' + opt.icon")
                  .label {{opt.label}}
        div(v-for="group in state.tackBlocks" :class="`${group.type}-group`")
          .icon-opt(
            v-if="group.type === 'inline'"
            v-for="opt in group.opts"
            :data-width="btnWidth(group.opts)"
            :data-selected="isSelected(opt)"
            :data-separator="opt.type === 'separator'"
            :data-color="opt.color ? opt.color : false"
            :data-inactive="opt.inactive"
            :title="opt.tooltip ?? opt.label"
            @mousedown="onMouseDown($event, opt)"
            @mouseup="onMouseUp($event, opt)")
            svg.badge(v-if="opt.badge" :data-img="!!opt.img"): use(:xlink:href="'#' + opt.badge")
            img.icon(v-if="opt.img" :src="opt.img")
            svg.icon(v-else): use(:xlink:href="'#' + opt.icon")
          .opt(
            v-if="group.type === 'list'"
            v-for="(opt, i) in group.opts"
            :key="opt.label"
            :data-selected="isSelected(opt)"
            :data-separator="opt.type === 'separator'"
            :data-inactive="opt.inactive"
            :data-color="opt.color ? opt.color : false"
            :title="opt.tooltip ?? opt.label"
            @mousedown="onMouseDown($event, opt)"
            @mouseup="onMouseUp($event, opt)")
            .icon-box(v-if="Settings.reactive.ctxMenuRenderIcons")
              svg.badge(v-if="opt.badge" :data-img="!!opt.img"): use(:xlink:href="'#' + opt.badge")
              img.icon(v-if="opt.img" :src="opt.img")
              svg.icon(v-else-if="opt.icon"): use(:xlink:href="'#' + opt.icon")
            .label {{opt.label}}
            .icon-box(v-if="opt.sub")
              svg.icon.-rotate-90: use(xlink:href="#icon_expand")
</template>

<script lang="ts" setup>
import { ref, reactive, computed, nextTick, onMounted } from 'vue'
import { MenuBlock, MenuOption, ContextMenuComponent } from 'src/types'
import { Sidebar } from 'src/services/sidebar'
import { Settings } from 'src/services/settings'
import { Selection } from 'src/services/selection'
import { Menu } from 'src/services/menu'
import { Mouse } from 'src/services/mouse'
import ScrollBox from 'src/components/scroll-box.vue'

let lastPhase: 'tick' | 'tack' = 'tack'

const tickEl = ref<HTMLElement | null>(null)
const tackEl = ref<HTMLElement | null>(null)
const state = reactive({
  tickActive: false,
  tackActive: false,
  tickBlocks: [] as MenuBlock[],
  tackBlocks: [] as MenuBlock[],
  tickPosStyle: { transform: 'translateY(0px) translateX(0px)', bottom: '' },
  tackPosStyle: { transform: 'translateY(0px) translateX(0px)', bottom: '' },

  selected: -1,
  sub: null as MenuBlock | null,
})

const isActive = computed((): boolean => state.tickActive || state.tackActive)
const tickAll = computed((): MenuOption[] => {
  return state.tickBlocks.reduce<MenuOption[]>((a, v) => a.concat(v.opts), [])
})
const tackAll = computed((): MenuOption[] => {
  return state.tackBlocks.reduce<MenuOption[]>((a, v) => a.concat(v.opts), [])
})

onMounted(() => {
  Menu.onOpen((blocks: MenuBlock[], x = 0, y = 0) => {
    const boxH = document.body.offsetHeight

    state.selected = -1
    if (lastPhase === 'tack') {
      state.tickBlocks = blocks
      state.tickActive = true
      state.tackActive = false
      lastPhase = 'tick'
      nextTick(() => {
        if (!tickEl.value) return
        const isLowerThanViewport = tickEl.value.offsetHeight < boxH
        const isAbovePointer = tickEl.value.offsetHeight + y >= boxH && isLowerThanViewport
        y = getY(tickEl.value.offsetHeight, y, isAbovePointer)
        x = getX(tickEl.value.offsetWidth, x)
        state.tickPosStyle.transform = `translateY(${y}px) translateX(${x}px)`
        state.tickPosStyle.bottom = isAbovePointer ? '0px' : ''
      })
    } else {
      state.tackBlocks = blocks
      state.tackActive = true
      state.tickActive = false
      lastPhase = 'tack'
      nextTick(() => {
        if (!tackEl.value) return
        const isLowerThanViewport = tackEl.value.offsetHeight < boxH
        const isAbovePointer = tackEl.value.offsetHeight + y >= boxH && isLowerThanViewport
        y = getY(tackEl.value.offsetHeight, y, isAbovePointer)
        x = getX(tackEl.value.offsetWidth, x)
        state.tackPosStyle.transform = `translateY(${y}px) translateX(${x}px)`
        state.tackPosStyle.bottom = isAbovePointer ? '0px' : ''
      })
    }
  })

  Menu.onClose(() => {
    state.tickActive = false
    state.tackActive = false
    state.sub = null
  })
})

function onMouseDown(e: MouseEvent, opt: MenuOption): void {
  Mouse.setTarget('menu.option', opt.label)
}

function onMouseUp(e: MouseEvent, opt: MenuOption): void {
  if (!Mouse.isTarget('menu.option', opt.label)) return

  if (e.button === 0 && !e.altKey) activateOption(opt)
  else if (e.button === 1 || (e.button === 0 && e.altKey)) activateOption(opt, true)
}

function selectOption(dir: number): void {
  if (!dir) return

  let opts
  if (state.sub) opts = state.sub.opts
  else opts = state.tickActive ? tickAll.value : tackAll.value

  if (state.selected < 0) {
    if (dir > 0) state.selected = 0
    else state.selected = opts.length - 1
    return
  }

  if (state.selected >= 0) {
    let i = state.selected + dir

    while (opts[i] && (opts[i].type === 'separator' || opts[i].inactive)) {
      i += dir
    }

    if (i < 0 || i >= opts.length) return
    state.selected = i
  }
}

function activateOption(opt?: MenuOption, altMode?: boolean): void {
  if (!opt) {
    if (state.selected < 0) return
    const opts = state.tickActive ? tickAll.value : tackAll.value
    opt = opts[state.selected]
  }
  if (opt.inactive) return
  if (altMode && opt.onAltClick) opt.onAltClick()
  if (!altMode && opt.onClick) opt.onClick()
  if (opt.sub) {
    state.selected = -1
    state.sub = { type: 'list', name: opt.label, opts: opt.sub }
    return
  }
  Menu.close()
  Selection.resetSelection()
}

function closeSubMenu(): void {
  state.sub = null
}

function getX(menuWidth: number, x: number): number {
  const maxX = Sidebar.reactive.width - menuWidth - 2
  if (x > maxX) return maxX
  else return x
}

function getY(menuH: number, y: number, isAbovePointer: boolean): number {
  const boxH = document.body.offsetHeight
  if (menuH >= boxH) return 1
  if (isAbovePointer && menuH > y) return boxH - 1
  return y
}

function btnWidth(opts: MenuOption[]): string {
  let len = opts.reduce((a, v) => (v.constructor === String ? a : a + 1), 0)
  if (len <= 5) return 'norm'
  if (len === 6) return '3'
  if (len === 8) return '4'
  return 'wrap'
}

function isSelected(opt: MenuOption): boolean {
  let opts
  if (state.sub) opts = state.sub.opts
  else opts = state.tickActive ? tickAll.value : tackAll.value
  return opts[state.selected] === opt
}

const publicInterface: ContextMenuComponent = { selectOption, activateOption }
defineExpose(publicInterface)
Menu.registerComponent(publicInterface)
</script>
