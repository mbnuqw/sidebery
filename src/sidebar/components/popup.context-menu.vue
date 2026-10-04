<template lang="pug">
.CtxMenu(:data-active="isActive" @mousedown.stop @mouseup.stop)
  Transition(name="menu" type="transition"): .container(v-show="state.tickActive")
    .box.tick(ref="tickEl" :style="state.tickPosStyle")
      ScrollBox
        Transition(name="sub-menu" type="transition")
          .sub-menu-box(v-if="currentSub" :key="state.subStack.length")
            .sub-menu
              .scroll-box
                .opt(@click="closeSubMenu")
                  .icon-box
                    svg.icon.-rotate90: use(href="#icon_expand")
                  .label.-header {{currentSub.name}}
                .opt(:data-separator="true")
                .opt(
                  v-for="opt in currentSub.opts"
                  :data-selected="isSelected(opt)"
                  :data-separator="opt.type === 'separator'"
                  :data-inactive="opt.inactive"
                  :data-color="opt.color ? opt.color : false"
                  :title="opt.tooltip ?? opt.label"
                  @mousedown="onMouseDown($event, opt)"
                  @mouseup="onMouseUp($event, opt)")
                  .icon-box(v-if="Settings.state.ctxMenuRenderIcons")
                    svg.badge(v-if="opt.badge" :data-img="!!opt.img"): use(:href="'#' + opt.badge")
                    img.icon(v-if="opt.img" :src="opt.img")
                    svg.icon(v-else-if="opt.icon"): use(:href="'#' + opt.icon")
                  .label {{opt.label}}
                  .sub-btn(
                    v-if="opt.sub"
                    @mousedown.stop=""
                    @mouseup.stop="openSubMenu(opt)")
                    svg.sub-icon.-rotate-90: use(href="#icon_expand")
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
            svg.badge(v-if="opt.badge" :data-img="!!opt.img"): use(:href="'#' + opt.badge")
            img.icon(v-if="opt.img" :src="opt.img")
            svg.icon(v-else): use(:href="'#' + opt.icon")
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
            .icon-box(v-if="Settings.state.ctxMenuRenderIcons")
              svg.badge(v-if="opt.badge" :data-img="!!opt.img"): use(:href="'#' + opt.badge")
              img.icon(v-if="opt.img" :src="opt.img")
              svg.icon(v-else-if="opt.icon"): use(:href="'#' + opt.icon")
            .label {{opt.label}}
            .sub-btn(
              v-if="opt.sub"
              @mousedown.stop=""
              @mouseup.stop="openSubMenu(opt)")
              svg.sub-icon.-rotate-90: use(href="#icon_expand")
            .flag-btn(
              v-if="opt.flag?.icon"
              :data-active="!!opt.flag.active"
              @mousedown.stop=""
              @mouseup.stop="opt.flag?.onClick?.(opt)")
              svg.flag-icon(v-if="opt.flag.icon.startsWith('#')"): use(:href="opt.flag.icon")
              img.flag-icon(v-else :src="opt.flag.icon")
  Transition(name="menu" type="transition"): .container(v-show="state.tackActive")
    .box.tack(ref="tackEl" :style="state.tackPosStyle")
      ScrollBox
        Transition(name="sub-menu" type="transition")
          .sub-menu-box(v-if="currentSub" :key="state.subStack.length")
            .sub-menu
              .scroll-box
                .opt(@click="closeSubMenu")
                  .icon-box
                    svg.icon.-rotate90: use(href="#icon_expand")
                  .label.-header {{currentSub.name}}
                .opt(:data-separator="true")
                .opt(
                  v-for="opt in currentSub.opts"
                  :data-selected="isSelected(opt)"
                  :data-separator="opt.type === 'separator'"
                  :data-inactive="opt.inactive"
                  :data-color="opt.color ? opt.color : false"
                  :title="opt.tooltip ?? opt.label"
                  @mousedown="onMouseDown($event, opt)"
                  @mouseup="onMouseUp($event, opt)")
                  .icon-box(v-if="Settings.state.ctxMenuRenderIcons")
                    svg.badge(v-if="opt.badge" :data-img="!!opt.img"): use(:href="'#' + opt.badge")
                    img.icon(v-if="opt.img" :src="opt.img")
                    svg.icon(v-else-if="opt.icon"): use(:href="'#' + opt.icon")
                  .label {{opt.label}}
                  .sub-btn(
                    v-if="opt.sub"
                    @mousedown.stop=""
                    @mouseup.stop="openSubMenu(opt)")
                    svg.sub-icon.-rotate-90: use(href="#icon_expand")
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
            svg.badge(v-if="opt.badge" :data-img="!!opt.img"): use(:href="'#' + opt.badge")
            img.icon(v-if="opt.img" :src="opt.img")
            svg.icon(v-else): use(:href="'#' + opt.icon")
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
            .icon-box(v-if="Settings.state.ctxMenuRenderIcons")
              svg.badge(v-if="opt.badge" :data-img="!!opt.img"): use(:href="'#' + opt.badge")
              img.icon(v-if="opt.img" :src="opt.img")
              svg.icon(v-else-if="opt.icon"): use(:href="'#' + opt.icon")
            .label {{opt.label}}
            .sub-btn(
              v-if="opt.sub"
              @mousedown.stop=""
              @mouseup.stop="openSubMenu(opt)")
              svg.sub-icon.-rotate-90: use(href="#icon_expand")
            .flag-btn(
              v-if="opt.flag?.icon"
              :data-active="!!opt.flag.active"
              @mousedown.stop=""
              @mouseup.stop="opt.flag?.onClick?.(opt)")
              svg.flag-icon(v-if="opt.flag.icon.startsWith('#')"): use(:href="opt.flag.icon")
              img.flag-icon(v-else :src="opt.flag.icon")
</template>

<script lang="ts" setup>
import { ref, reactive, computed, nextTick, onMounted } from 'vue'
import type * as T from 'src/types'
import * as Sidebar from 'src/services/sidebar.fg'
import * as Settings from 'src/services/settings'
import * as Selection from 'src/services/selection.fg'
import * as Menu from 'src/services/menu.fg'
import * as Mouse from 'src/services/mouse.fg'
import * as Search from 'src/services/search.fg'
import ScrollBox from 'src/components/scroll-box.vue'
import { PRE_SCROLL } from 'src/defaults'

let lastPhase: 'tick' | 'tack' = 'tack'

const tickEl = ref<HTMLElement | null>(null)
const tackEl = ref<HTMLElement | null>(null)
const state = reactive({
  tickActive: false,
  tackActive: false,
  tickBlocks: [] as T.MenuBlock[],
  tackBlocks: [] as T.MenuBlock[],
  tickPosStyle: { transform: 'translateY(0px) translateX(0px)', bottom: '' },
  tackPosStyle: { transform: 'translateY(0px) translateX(0px)', bottom: '' },

  selected: -1,
  subStack: [] as T.MenuBlock[],
})

const isActive = computed((): boolean => state.tickActive || state.tackActive)
const tickAll = computed((): T.MenuOption[] => {
  return state.tickBlocks.reduce<T.MenuOption[]>((a, v) => a.concat(v.opts), [])
})
const tackAll = computed((): T.MenuOption[] => {
  return state.tackBlocks.reduce<T.MenuOption[]>((a, v) => a.concat(v.opts), [])
})
const currentSub = computed((): T.MenuBlock | null => {
  return state.subStack[state.subStack.length - 1] ?? null
})

onMounted(() => {
  Menu.onOpen((blocks: T.MenuBlock[], x = 0, y = 0) => {
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
        if (Settings.state.selLen && Sidebar.reactive.selLen) {
          Sidebar.reactive.selLenBadgeTarget = tickEl.value
        }
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
        if (Settings.state.selLen && Sidebar.reactive.selLen) {
          Sidebar.reactive.selLenBadgeTarget = tackEl.value
        }
      })
    }
  })

  Menu.onClose(() => {
    state.tickActive = false
    state.tackActive = false
    state.subStack = []
  })
})

function onMouseDown(e: MouseEvent, opt: T.MenuOption): void {
  Mouse.setTarget('menu.option', opt.label)
}

function onMouseUp(e: MouseEvent, opt: T.MenuOption): void {
  if (!Mouse.isTarget('menu.option', opt.label)) return

  if (e.button === 0 && !e.altKey) activateOption(opt)
  else if (e.button === 1 || (e.button === 0 && e.altKey)) activateOption(opt, true)
}

const scrollConf: ScrollToOptions = { behavior: 'smooth', top: 0 }
function scrollToOption(opt: T.MenuOption) {
  const query = `.opt[title="${opt.tooltip ?? opt.label}"]`
  const optEl = document.querySelector(query) as HTMLElement | null
  if (!optEl) return

  let scrollEl: HTMLElement | null | undefined
  if (optEl.parentElement?.className === 'scroll-box') scrollEl = optEl.parentElement
  else {
    const boxClass = state.tickActive ? '.tick' : '.tack'
    const query = `.CtxMenu ${boxClass} .scroll-container`
    scrollEl = document.querySelector(query) as HTMLElement | null
  }

  if (!scrollEl) return

  const sR = scrollEl.getBoundingClientRect()
  const bR = optEl.getBoundingClientRect()
  const pH = scrollEl.offsetHeight
  const pS = scrollEl.scrollTop
  const bH = optEl.offsetHeight
  const bY = bR.top - sR.top + pS

  if (bY < pS + PRE_SCROLL) {
    if (pS > 0) {
      let y = bY - PRE_SCROLL
      if (y < 0) y = 0
      scrollConf.top = y
      scrollEl.scroll(scrollConf)
    }
  } else if (bY + bH > pS + pH - PRE_SCROLL) {
    scrollConf.top = bY + bH - pH + PRE_SCROLL
    scrollEl.scroll(scrollConf)
  }
}

function selectOption(dir: number): void {
  if (!dir) return

  let opts
  if (currentSub.value) opts = currentSub.value.opts
  else opts = state.tickActive ? tickAll.value : tackAll.value

  if (state.selected < 0) {
    if (dir > 0) state.selected = 0
    else state.selected = opts.length - 1
    scrollToOption(opts[state.selected])
    return
  }

  if (state.selected >= 0) {
    let i = state.selected + dir

    while (opts[i] && (opts[i].type === 'separator' || opts[i].inactive)) {
      i += dir
    }

    if (i < 0 || i >= opts.length) return
    state.selected = i
    scrollToOption(opts[i])
  }
}

function activateOption(opt?: T.MenuOption, altMode?: boolean): boolean | undefined {
  if (!opt) {
    if (state.selected < 0) return
    let opts
    if (currentSub.value) opts = currentSub.value.opts
    else opts = state.tickActive ? tickAll.value : tackAll.value
    opt = opts[state.selected]
    if (!opt) return
  }
  if (opt.inactive) return false
  if (altMode && opt.onAltClick) opt.onAltClick()
  if (!altMode && opt.onClick) opt.onClick()
  // Descend into submenu only if the option has no direct action of its own
  // (e.g. "Move to" / "Reopen in" containers). Options with both `onClick`
  // and `sub` (e.g. "Move to <panel>" rows that also list that panel's
  // groups) run their action and close the menu; use the dedicated
  // sub-menu button to descend instead.
  if (opt.sub && !opt.onClick) {
    state.selected = -1
    pushSubMenu(opt)
    return false
  }
  Menu.close()
  Selection.resetSelection()
  if (!opt.keepSearching && Search.active && !Settings.state.searchMenuTrig) {
    Search.stop()
  }
  return true
}

function pushSubMenu(opt: T.MenuOption): void {
  if (!opt.sub) return
  state.subStack.push({ type: 'list', name: opt.label, opts: opt.sub })
}

function openSubMenu(opt: T.MenuOption): void {
  state.selected = -1
  pushSubMenu(opt)
}

function closeSubMenu(): void {
  state.subStack.pop()
}

function getX(menuWidth: number, x: number): number {
  const maxX = Sidebar.width - menuWidth - 2
  if (x > maxX) return maxX
  else return x
}

function getY(menuH: number, y: number, isAbovePointer: boolean): number {
  const boxH = document.body.offsetHeight
  if (menuH >= boxH) return 0
  if (isAbovePointer && menuH > y) return boxH - 16
  return isAbovePointer ? y - 1 : y + 1
}

function btnWidth(opts: T.MenuOption[]): string {
  let len = opts.reduce((a, v) => (v.constructor === String ? a : a + 1), 0)
  if (len <= 5) return 'norm'
  if (len === 6) return '3'
  if (len === 8) return '4'
  return 'wrap'
}

function isSelected(opt: T.MenuOption): boolean {
  let opts
  if (currentSub.value) opts = currentSub.value.opts
  else opts = state.tickActive ? tickAll.value : tackAll.value
  return opts[state.selected] === opt
}

const publicInterface: T.ContextMenuComponent = { selectOption, activateOption }
defineExpose(publicInterface)
Menu.registerComponent(publicInterface)
</script>
